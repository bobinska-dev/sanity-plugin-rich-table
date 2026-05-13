// typescript
import {EditorConfig} from '@portabletext/editor'
import {useToolbarSchema} from '@portabletext/toolbar'
import {BlockContentIcon} from '@sanity/icons'
import {Box, Card, Flex, Popover, Text} from '@sanity/ui'
import {
  ComponentType,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  Ref,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import {styled} from 'styled-components'

import {extendAnnotation} from '../../configs/extendAnnotation'
import {extendBlockObject} from '../../configs/extendBlockObject'
import extendDecorator from '../../configs/extendDecorators'
import {extendInlineObject} from '../../configs/extendInlineObject'
import {extendList} from '../../configs/extendList'
import extendStyle from '../../configs/extendStyles'
import AnnotationPopover from '../annotation/AnnotationPopover'
import StyleSelector from '../StyleSelector'
import AnnotationButton from './AnnotationButton'
import DecoratorButton from './DecoratorButton'
import FloatingButton from './FloatingButton'
import ListButton from './ListButton'

const StyledFloatingButton = styled(FloatingButton)<{
  $isFocused: boolean
}>`
  display: inline-block;
  opacity: ${(props) => (props.$isFocused ? 1 : 0.2)};
`

const ButtonToolbar: ComponentType<{focused: boolean; editorRef: RefObject<EditorConfig>}> = ({
  focused,
  editorRef,
}) => {
  const toolbarSchema = useToolbarSchema({
    extendDecorator,
    extendAnnotation,
    extendStyle,
    extendList,
    extendBlockObject,
    extendInlineObject,
  })

  // STATES
  const [open, setOpen] = useState(false)

  // * REFS & IDS
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const popoverId = 'context-menu-toolbar-popover'

  // Helpers: discover focusable elements inside popover
  const getFocusableElements = (root: HTMLElement | null) => {
    if (!root) return [] as HTMLElement[]
    const selectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const nodeList = Array.from(root.querySelectorAll<HTMLElement>(selectors))
    return nodeList.filter(
      (el) =>
        !el.hasAttribute('disabled') &&
        el.getAttribute('aria-hidden') !== 'true' &&
        el.offsetParent !== null,
    )
  }

  // Centralized close that returns focus to the editorRef
  const closePopover = useCallback(
    (returnFocusToEditor = true) => {
      setOpen(false)
      if (returnFocusToEditor) {
        // Defer focus so any click/activation handlers run first
        setTimeout(() => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(editorRef?.current as any)?.focus?.()
          } catch {
            // noop
          }
        }, 0)
      }
    },
    [editorRef],
  )

  // Toggle handler
  const handleOpenClick = useCallback(() => {
    setOpen((prev) => {
      const next = !prev
      // when closing via the trigger, return focus to editor
      if (!next) {
        setTimeout(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(editorRef?.current as any)?.focus?.()
        }, 0)
      }
      return next
    })
  }, [editorRef])

  // Close popover on outside click (but not on internal clicks)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!open) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const composedPath = (event as any).composedPath?.() || (event as any).path || []
      if (composedPath && composedPath.length) {
        if (triggerRef.current && composedPath.includes(triggerRef.current)) return
        if (popoverRef.current && composedPath.includes(popoverRef.current)) return
        closePopover(true)
        return
      }

      const target = event.target as Node | null
      if (triggerRef.current && target && triggerRef.current.contains(target)) return
      if (popoverRef.current && target && popoverRef.current.contains(target)) return
      closePopover(true)
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [open, closePopover])

  // Hotkey to open/close toolbar
  useEffect(() => {
    const handleHotkey = (e: KeyboardEvent) => {
      const target = e.target as Node | null
      if (
        e.shiftKey &&
        e.metaKey &&
        e.key === 'o' &&
        triggerRef.current?.parentNode &&
        target &&
        triggerRef.current?.parentNode?.contains(target)
      ) {
        setOpen((prev) => !prev)
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', handleHotkey)

    return () => window.removeEventListener('keydown', handleHotkey)
  }, [])

  // When opening, focus first focusable element inside the popover
  useEffect(() => {
    if (!open) return undefined
    const t = setTimeout(() => {
      const first = getFocusableElements(popoverRef.current)[0]
      if (first) {
        first.focus()
      } else if (popoverRef.current) {
        popoverRef.current.focus()
      }
    }, 0)
    return () => clearTimeout(t)
  }, [open])

  // * Key navigation within popover
  // Use boolean to avoid TS literal comparison issues
  const isVertical = false
  const handlePopoverKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const root = popoverRef.current
    if (!root) return
    const focusables = getFocusableElements(root)
    if (!focusables.length) return

    const active = document.activeElement as HTMLElement | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentIndex = focusables.indexOf(active ?? (null as any))
    const len = focusables.length

    const focusAt = (index: number) => {
      const i = (index + len) % len
      focusables[i].focus()
    }

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        if (isVertical) {
          if (currentIndex === -1) focusAt(0)
          else focusAt(currentIndex + 1)
        } else if (currentIndex === -1) focusAt(0)
        else focusAt(currentIndex + 1)
        break
      case 'ArrowDown':
        event.preventDefault()
        if (isVertical) {
          if (currentIndex === -1) focusAt(0)
          else focusAt(currentIndex + 1)
        } else if (currentIndex === -1) focusAt(0)
        else focusAt(currentIndex + 1)
        break
      case 'ArrowLeft':
        event.preventDefault()
        if (isVertical) {
          if (currentIndex === -1) focusAt(0)
          else focusAt(currentIndex - 1)
        } else if (currentIndex === -1) focusAt(0)
        else focusAt(currentIndex - 1)
        break
      case 'ArrowUp':
        event.preventDefault()
        if (isVertical) {
          if (currentIndex === -1) focusAt(0)
          else focusAt(currentIndex - 1)
        } else if (currentIndex === -1) focusAt(0)
        else focusAt(currentIndex - 1)
        break
      case 'Home':
        event.preventDefault()
        focusAt(0)
        break
      case 'End':
        event.preventDefault()
        focusAt(len - 1)
        break
      case 'Escape':
        event.preventDefault()
        closePopover(true)
        // return focus to editor handled by closePopover
        break
      case 'Tab':
        // Allow tab to move out, but close the popover and return focus
        event.preventDefault()
        closePopover(true)
        break
      case 'Enter':
        // If Enter is pressed while a toolbar button is focused, allow its activation then close and refocus.
        // Defer closing so the activated action runs first.
        if (active && root.contains(active)) {
          setTimeout(() => closePopover(true), 0)
        }
        break
      default:
        break
    }
  }

  // If an internal button is clicked (or any focusable inside the popover),
  // close and return focus to the editor after the click handlers run.
  const handlePopoverClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null
    if (!target || !popoverRef.current) return
    const clickedFocusable = target.closest('button, [role="button"], a, input, select, textarea ')

    // Ignore clicks on the style selector button (id="style-select")
    if (clickedFocusable?.id === 'style-selection') return

    if (clickedFocusable && popoverRef.current.contains(clickedFocusable)) {
      // allow activation to proceed, then close & refocus
      setTimeout(() => closePopover(true), 0)
    }
  }

  return (
    <>
      <Popover
        open={open}
        id={popoverId}
        placement="top"
        content={
          <Box
            ref={popoverRef}
            role="toolbar"
            aria-label="Text formatting options"
            tabIndex={-1}
            data-orientation={isVertical ? 'vertical' : 'horizontal'}
            onKeyDown={handlePopoverKeyDown}
            onClick={handlePopoverClick}
          >
            <Box padding={4} paddingBottom={2}>
              <Text size={0} muted style={{fontStyle: 'italic'}}>
                Select your style, list or custom block (navigate with ← → and Enter)
              </Text>
            </Box>
            <Flex padding={3} justify={'space-between'} gap={1}>
              <StyleSelector toolbarSchema={toolbarSchema} />
              {toolbarSchema.decorators &&
                toolbarSchema.decorators?.map((decorator) => (
                  <DecoratorButton key={decorator.name} decorator={decorator} />
                ))}
              <Card borderRight />
              {toolbarSchema.annotations &&
                toolbarSchema.annotations?.map((annotation) => (
                  <AnnotationButton key={annotation.name} annotation={annotation} />
                ))}
              <Card borderRight />
              {toolbarSchema.lists?.map((list) => (
                <ListButton key={list.name} list={list} />
              ))}
            </Flex>
          </Box>
        }
        portal
        arrow
        zOffset={5}
      >
        <StyledFloatingButton
          fontSize={0}
          mode={'bleed'}
          icon={BlockContentIcon}
          onClick={handleOpenClick}
          padding={2}
          ref={triggerRef as unknown as Ref<HTMLButtonElement>}
          title="Open text formatting toolbar (⇧⌘O)"
          $isFocused={focused}
          aria-label="Open text formatting toolbar (⇧⌘O)"
          aria-expanded={open}
          aria-haspopup="true"
          aria-controls={popoverId}
        />
      </Popover>
      {toolbarSchema.annotations && <AnnotationPopover schemaTypes={toolbarSchema.annotations} />}
    </>
  )
}

export default ButtonToolbar
