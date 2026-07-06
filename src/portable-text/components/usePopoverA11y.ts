import {useEditor} from '@portabletext/editor'
import {type FocusEvent, type KeyboardEvent, useCallback, useRef, useState} from 'react'

/**
 * Keyboard + focus support shared by the selection popovers (annotation / block /
 * inline object), which otherwise expose their edit/remove actions to the mouse
 * only.
 *
 * - `focusWithin` tracks focus inside the popover. React focus events bubble
 *   through the portal, so this works whether or not `@sanity/ui`'s `Popover`
 *   portals its content. The caller gates its render on `focused || focusWithin`
 *   so Tabbing into the popover (which blurs the editable → `focused` goes false)
 *   doesn't unmount it mid-interaction.
 * - `Escape` returns focus to the editable via `editor.send({type: 'focus'})` —
 *   the same mechanism {@link ButtonToolbar}'s `closePopover` uses.
 *
 * The `contentProps` deliberately do NOT auto-focus on open: these popovers appear
 * on selection, and stealing focus would collapse a mouse user's selection. Focus
 * moves in only when the user Tabs to the actions.
 */
export function usePopoverA11y() {
  const editor = useEditor()
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [focusWithin, setFocusWithin] = useState(false)

  const returnFocusToEditor = useCallback(() => {
    setFocusWithin(false)
    // Defer so any activation handler runs first (mirrors ButtonToolbar.closePopover).
    setTimeout(() => editor.send({type: 'focus'}), 0)
  }, [editor])

  const contentProps = {
    ref: contentRef,
    tabIndex: -1,
    onFocus: () => setFocusWithin(true),
    onBlur: (event: FocusEvent) => {
      if (!contentRef.current?.contains(event.relatedTarget as Node | null)) {
        setFocusWithin(false)
      }
    },
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        returnFocusToEditor()
      }
    },
  }

  return {focusWithin, contentProps, returnFocusToEditor}
}
