// typescript
import {useEditor} from '@portabletext/editor'
import {useToolbarSchema} from '@portabletext/toolbar'
import {BlockContentIcon} from '@sanity/icons'
import {Box, Card, Flex, Popover, Text} from '@sanity/ui'
import {
  ComponentType,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  Ref,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import {ArraySchemaType, Path, PortableTextBlock} from 'sanity'
import {styled} from 'styled-components'

import {createExtendAnnotation} from '../../configs/extendAnnotation'
import type {SanityBlockSchemaLike} from '../../configs/extendBlockObject'
import {createExtendBlockObject} from '../../configs/extendBlockObject'
import {createExtendDecorators} from '../../configs/extendDecorators'
import {createExtendInlineObject} from '../../configs/extendInlineObject'
import {createExtendList} from '../../configs/extendList'
import {createExtendStyles} from '../../configs/extendStyles'
import {extractBlockConfig} from '../../configs/extractBlockConfig'
import AnnotationPopover from '../annotation/AnnotationPopover'
import BlockPopover from '../custom-blocks/BlockPopover'
import InlineObjectPopover from '../custom-blocks/InlineObjectPopover'
import StyleSelector from '../StyleSelector'
import AnnotationButton from './AnnotationButton'
import BlockButton from './BlockButton'
import DecoratorButton from './DecoratorButton'
import InlineObjectButton from './InlineObjectButton'
import FloatingButton from './FloatingButton'
import ListButton from './ListButton'

const StyledFloatingButton = styled(FloatingButton)<{
  $isFocused: boolean
}>`
  display: inline-block;
  opacity: ${(props) => (props.$isFocused ? 1 : 0.6)};
`

const ButtonToolbar: ComponentType<{
  focused: boolean
  schemaType?: ArraySchemaType<PortableTextBlock>
  path: Path
}> = ({focused, schemaType, path}) => {
  // The real editor (this component renders inside EditorProvider). Used to
  // return focus to the editable — the previous `editorRef` was the EditorConfig,
  // whose `.focus()` is a no-op, so focus/selection never came back.
  const editor = useEditor()
  // Whether the popover was opened via keyboard (⇧⌘O). Only then do we move focus
  // into the popover on open; a mouse open must NOT steal focus from the editable
  // (that collapses the selection and makes toggle buttons no-op).
  const openedByKeyboardRef = useRef(false)
  const blockSchemas = useMemo((): ReadonlyArray<SanityBlockSchemaLike> | undefined => {
    const schema = schemaType as {type?: {of?: unknown[]}; of?: unknown[]} | undefined
    // Prefer the array's own (populated) members; only fall back to the parent
    // type's `of` when the schema itself carries none. The intrinsic `array`
    // type's `of` is empty, so a plain `??` would shadow the real members.
    const of = schema?.of?.length ? schema.of : schema?.type?.of
    return of as ReadonlyArray<SanityBlockSchemaLike> | undefined
  }, [schemaType])

  const extendBlockObject = useMemo(() => createExtendBlockObject(blockSchemas), [blockSchemas])

  // Pull the consumer's decorators/styles/lists/annotations off the compiled
  // block (extractBlockConfig knows the nested compiled paths) so the toolbar
  // shows their schema-defined icons/titles. Built-ins remain the fallback.
  const blockConfig = useMemo(() => extractBlockConfig(schemaType), [schemaType])

  const extendDecorator = useMemo(
    () => createExtendDecorators(blockConfig?.decorators),
    [blockConfig],
  )
  const extendStyle = useMemo(() => createExtendStyles(blockConfig?.styles), [blockConfig])
  const extendList = useMemo(() => createExtendList(blockConfig?.lists), [blockConfig])
  const extendAnnotation = useMemo(
    () => createExtendAnnotation(blockConfig?.annotations),
    [blockConfig],
  )
  // Restore the schema-defined icon onto toolbar inline objects (the editor
  // strips it), mirroring extendBlockObject.
  const extendInlineObject = useMemo(
    () => createExtendInlineObject(blockConfig?.inlineObjects),
    [blockConfig],
  )

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
  // Unique per toolbar instance — each cell editor renders its own toolbar, so
  // constant ids would collide across cells (invalid duplicate DOM ids).
  const toolbarUid = useId()
  const popoverId = `context-menu-toolbar-popover-${toolbarUid}`
  const styleSelectorId = `style-selection-${toolbarUid}`

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

  // Centralized close that returns focus to the editable
  const closePopover = useCallback(
    (returnFocusToEditor = true) => {
      setOpen(false)
      if (returnFocusToEditor) {
        // Defer focus so any click/activation handlers run first
        setTimeout(() => editor.send({type: 'focus'}), 0)
      }
    },
    [editor],
  )

  // Toggle handler (mouse) — must not steal focus from the editable
  const handleOpenClick = useCallback(() => {
    openedByKeyboardRef.current = false
    setOpen((prev) => {
      const next = !prev
      // when closing via the trigger, return focus to editor
      if (!next) {
        setTimeout(() => editor.send({type: 'focus'}), 0)
      }
      return next
    })
  }, [editor])

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
        openedByKeyboardRef.current = true
        setOpen((prev) => !prev)
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', handleHotkey)

    return () => window.removeEventListener('keydown', handleHotkey)
  }, [])

  // When opening VIA KEYBOARD, move focus into the popover for arrow-key nav.
  // On a mouse open we intentionally leave focus on the editable so the current
  // selection survives and the toggle buttons apply to it.
  useEffect(() => {
    if (!open || !openedByKeyboardRef.current) return undefined
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
    if (clickedFocusable?.id === styleSelectorId) return

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
            // Keep the editable focused (and its selection alive) when clicking
            // toolbar buttons, so decorator/list/style toggles apply to the
            // current selection instead of a lost one.
            onMouseDown={(e) => e.preventDefault()}
          >
            <Box padding={4} paddingBottom={2}>
              <Text size={0} muted style={{fontStyle: 'italic'}}>
                Select your style, list or custom block (navigate with ← → and Enter)
              </Text>
            </Box>
            <Flex padding={3} justify={'space-between'} gap={1}>
              <StyleSelector toolbarSchema={toolbarSchema} id={styleSelectorId} />
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
              {toolbarSchema.blockObjects?.map((blockObject) => (
                <BlockButton key={blockObject.name} blockObject={blockObject} />
              ))}
              {toolbarSchema.inlineObjects?.map((inlineObject) => (
                <InlineObjectButton key={inlineObject.name} inlineObject={inlineObject} />
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
          // Opening the toolbar by mouse must not blur the editable / collapse
          // the selection, so the buttons act on the text that was selected.
          onMouseDown={(e: ReactMouseEvent<HTMLButtonElement>) => e.preventDefault()}
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
      {toolbarSchema.annotations && (
        <AnnotationPopover schemaTypes={toolbarSchema.annotations} path={path} />
      )}
      {/* Only render the block/inline-object popovers while this editor is focused,
          so a selected member's popover doesn't persist when focus moves to another
          PT editor. Both edit via the native document form (onPathOpen). */}
      {focused && toolbarSchema.blockObjects && (
        <BlockPopover schemaTypes={toolbarSchema.blockObjects} path={path} />
      )}
      {focused && toolbarSchema.inlineObjects && (
        <InlineObjectPopover schemaTypes={toolbarSchema.inlineObjects} path={path} />
      )}
    </>
  )
}

export default ButtonToolbar
