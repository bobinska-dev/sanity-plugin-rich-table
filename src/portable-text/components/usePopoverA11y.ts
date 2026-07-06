import {useEditor} from '@portabletext/editor'
import {
  type FocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

/** Selector for the popover's own tabbable controls (the Edit/Remove buttons). */
const FOCUSABLE = 'button, [href], input, [tabindex]:not([tabindex="-1"])'

/**
 * Keyboard + focus support shared by the selection popovers (annotation / block /
 * inline object), which otherwise expose their edit/remove actions to the mouse
 * only.
 *
 * These popovers are rendered in a portal, so a `Tab` from the editable travels
 * to the next control in DOM order (a toolbar button) and skips the popover
 * entirely. To make the actions keyboard-reachable without stealing focus from a
 * mouse user on open, the hook:
 *
 * - Treats the popover as a small `role="dialog"`: while it is open, `Tab` from
 *   the editable moves focus onto its first action, and `Tab`/`Shift+Tab` cycle
 *   between the actions rather than escaping into the portal's DOM neighbours.
 * - Returns focus to the editable on `Escape` via `editor.send({type: 'focus'})`
 *   — the same mechanism {@link ButtonToolbar}'s `closePopover` uses.
 * - Tracks `focusWithin` (React focus events bubble through the portal) so the
 *   caller can gate its render on `focused || focusWithin` and the popover isn't
 *   unmounted the moment Tabbing into it blurs the editable.
 *
 * It deliberately does NOT auto-focus on open: the popovers appear on selection,
 * and grabbing focus would collapse a mouse user's selection or trap a caret that
 * is merely passing through an annotation with the arrow keys.
 */
export function usePopoverA11y() {
  const editor = useEditor()
  const contentRef = useRef<HTMLDivElement | null>(null)
  // Mirrored into state so the Tab-capture effect re-runs when the (conditionally
  // rendered) popover content mounts/unmounts.
  const [contentEl, setContentEl] = useState<HTMLDivElement | null>(null)
  const [focusWithin, setFocusWithin] = useState(false)

  const setContentRef = useCallback((node: HTMLDivElement | null) => {
    contentRef.current = node
    setContentEl(node)
  }, [])

  const returnFocusToEditor = useCallback(() => {
    setFocusWithin(false)
    // Defer so any activation handler runs first (mirrors ButtonToolbar.closePopover).
    setTimeout(() => editor.send({type: 'focus'}), 0)
  }, [editor])

  // Move focus into the (portaled) popover when the user Tabs out of the editable
  // while it is open. Scoped to a live contentEl and to Tab-from-a-contentEditable
  // so it never hijacks Tab elsewhere on the page. Cycling once inside is handled
  // by `contentProps.onKeyDown`.
  useEffect(() => {
    if (!contentEl) return undefined

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || event.shiftKey) return
      if (contentEl.contains(document.activeElement)) return // already inside — let it cycle
      const active = document.activeElement as HTMLElement | null
      if (!active?.isContentEditable) return // only when the caret is in an editable
      const first = contentEl.querySelector<HTMLElement>(FOCUSABLE)
      if (first) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [contentEl])

  const contentProps = {
    ref: setContentRef,
    tabIndex: -1,
    onFocus: () => setFocusWithin(true),
    onBlur: (event: FocusEvent) => {
      if (!contentRef.current?.contains(event.relatedTarget as Node | null)) {
        setFocusWithin(false)
      }
    },
    onKeyDown: (event: ReactKeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        returnFocusToEditor()
        return
      }
      // Contain Tab within the popover's actions; Escape is the way back out.
      if (event.key === 'Tab') {
        const focusables = contentRef.current
          ? Array.from(contentRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
          : []
        if (focusables.length === 0) return
        const firstEl = focusables[0]
        const lastEl = focusables[focusables.length - 1]
        if (event.shiftKey && document.activeElement === firstEl) {
          event.preventDefault()
          lastEl.focus()
        } else if (!event.shiftKey && document.activeElement === lastEl) {
          event.preventDefault()
          firstEl.focus()
        }
      }
    },
  }

  return {focusWithin, contentProps, returnFocusToEditor}
}
