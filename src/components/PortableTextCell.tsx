import {EditIcon} from '@sanity/icons'
import {Box, Card} from '@sanity/ui'
import {ComponentType, KeyboardEvent, MouseEvent, useEffect} from 'react'
import {
  FieldMember,
  FormCallbacksProvider,
  MemberField,
  ObjectInputProps,
  OperationsAPI,
  Path,
  pathToString,
  PortableTextInput,
  PortableTextInputProps,
  useFormCallbacks,
} from 'sanity'
import {styled} from 'styled-components'

// Styled cell container with selection/editing states and preview mode styles
interface CellCardProps {
  $isSelected: boolean
  $isEditing: boolean
  $readOnly: boolean
}

const CellCard = styled(Card)<CellCardProps>`
  min-width: 200px;
  min-height: 32px;
  align-self: stretch; /* Let cells grow to match row height */
  cursor: ${({$readOnly}) => ($readOnly ? 'default' : 'pointer')};
  outline: 2px solid
    ${({$isSelected, $isEditing}) => ($isSelected || $isEditing ? '#2276fc' : 'transparent')};
  outline-offset: -2px;
  transition: outline-color 0.15s ease;
  position: relative;
  font-size: 0.875rem;
  overflow: hidden;

  /* Preview mode: hide toolbar */
  ${({$isEditing}) =>
    !$isEditing &&
    `
    [data-testid='pt-editor__toolbar-card'] {
      display: none !important;
    }
  `}

  /* Read-only mode: hide resize handles */
  ${({$readOnly}) =>
    $readOnly &&
    `
    [data-resize-handle],
    [data-testid*='resize'] {
      display: none !important;
    }
  `}
`

// Wrapper for cell content - handles pointer-events, stretches when row has editing cell
const CellContent = styled.div<{$isEditing: boolean; $rowHasEditingCell: boolean}>`
  height: 100%;
  max-height: ${({$isEditing, $rowHasEditingCell}) =>
    $isEditing || $rowHasEditingCell ? 'none' : '120px'};
  overflow: hidden;
  ${({$isEditing}) =>
    !$isEditing &&
    `
    pointer-events: none;
    user-select: none;

    /* Suppress all hover/focus effects on editor elements when not editing */
    * {
      pointer-events: none !important;
      cursor: default !important;
    }

    /* Hide any interactive UI elements from the PTE */
    [data-testid*='block-extras'],
    [data-testid*='change-bar'],
    [contenteditable] {
      cursor: default !important;
    }

    /* Suppress hover effects on blocks */
    [data-testid*='block'] {
      &:hover {
        background: transparent !important;
      }
    }
  `}
`

/** Render props passed through from ObjectInputProps to MemberField */
export type RenderProps = Pick<
  ObjectInputProps,
  | 'renderInput'
  | 'renderField'
  | 'renderItem'
  | 'renderPreview'
  | 'renderBlock'
  | 'renderInlineBlock'
  | 'renderAnnotation'
>

export interface PortableTextCellProps extends RenderProps {
  /** Content field member - if undefined, renders empty placeholder */
  member?: FieldMember
  /** Whether this cell is currently selected */
  isSelected: boolean
  /** Whether this cell is in edit mode */
  isEditing: boolean
  /** Whether any cell in this row is being edited */
  rowHasEditingCell?: boolean
  /** Table-level read-only flag */
  tableReadOnly?: boolean
  /** Base path for the cell, used for path rewriting in patches */
  cellBasePath?: Path
  /** Patch function from Sanity operations API */
  patch?: OperationsAPI['patch']
  /** Click handler for cell selection */
  onClick?: (e: MouseEvent) => void
  /** Double-click handler for entering edit mode */
  onDoubleClick?: () => void
  /** Keyboard handler for navigation */
  onKeyDown?: (e: KeyboardEvent) => void
  /** Tab index for keyboard focus */
  tabIndex?: number
  /** Unique key for the cell (used for data attribute) */
  cellKey: string
  /** Accessible label for the cell */
  cellLabel: string
  /** Handler to trigger edit mode when edit button is clicked */
  onEditClick?: () => void
  /** Handler to exit edit mode (called on Escape key) */
  onExitEdit?: () => void
}

// Edit button shown when cell is selected
const EditButton = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid #2276fc;
  background: white;
  color: #2276fc;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 0;
  pointer-events: auto;

  &:hover {
    background: #f0f6ff;
  }

  &:focus {
    outline: 2px solid #2276fc;
    outline-offset: 2px;
  }
`

/**
 * Unified cell component that handles both container styling and content rendering.
 * - isEditing=false: Non-interactive preview with hidden toolbar/scrollbars
 * - isEditing=true: Full editing with FormCallbacksProvider for path rewriting
 *
 * ## Path Rewriting Architecture
 *
 * When editing a cell, Sanity's form components emit patches with paths relative to
 * the cell's content field (e.g., `[0, 'children', 0, 'text']`). However, these patches
 * need to target the actual document location (e.g., `rows[0].cells[2].content[0].children[0].text`).
 *
 * We solve this by:
 * 1. Wrapping the editing cell in a `FormCallbacksProvider` with custom `onChange`
 * 2. Intercepting patch events and prepending `cellBasePath` to each patch's path
 * 3. Executing the rewritten patches directly via `patch.execute()`
 *
 * This approach is performant because:
 * - Only ONE cell can be in edit mode at a time (controlled by `editingCellKey` in TableV2)
 * - Non-editing cells return the wrapper directly without any provider
 * - No unnecessary re-renders of other cells when one cell is edited
 */
const PortableTextCell: ComponentType<PortableTextCellProps> = ({
  member,
  isSelected,
  isEditing,
  rowHasEditingCell = false,
  tableReadOnly = false,
  cellBasePath = [],
  patch,
  onClick,
  onDoubleClick,
  onKeyDown,
  tabIndex,
  cellKey,
  cellLabel,
  onEditClick,
  onExitEdit,
  renderInput,
  renderField,
  ...otherRenderProps
}) => {
  const parentCallbacks = useFormCallbacks()

  // Global Escape key handler for exiting edit mode
  // This catches Escape even when focus is inside the PTE
  useEffect(() => {
    if (!isEditing || !onExitEdit) return undefined

    // eslint-disable-next-line no-undef
    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onExitEdit()
      }
    }

    // Use capture phase to intercept before PTE handles it
    document.addEventListener('keydown', handleEscape, true)
    return () => document.removeEventListener('keydown', handleEscape, true)
  }, [isEditing, onExitEdit])

  /**
   * Patched callbacks for edit mode - rewrites paths for correct document location.
   *
   * When Sanity form components emit changes, they use paths relative to their
   * local context. For a cell's content, a patch might look like:
   *   { type: 'set', path: [0, 'children', 0, 'text'], value: 'Hello' }
   *
   * But the document expects the full path:
   *   rows[0].cells[2].content[0].children[0].text
   *
   * We intercept onChange, prepend cellBasePath to each patch's path, and
   * execute via patch.execute() to apply at the correct document location.
   */
  const patchedCallbacks = {
    ...parentCallbacks,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (event: any) => {
      // Pass through if not editing or no patches to rewrite
      if (!isEditing || !event?.patches) {
        parentCallbacks.onChange?.(event)
        return
      }

      // Rewrite each patch's path by prepending the cell's base path
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rewrittenPatches = event.patches.map((p: any) => {
        // Combine cell base path with the patch's relative path
        // e.g., ['rows', 0, 'cells', 2, 'content'] + [0, 'children', 0, 'text']
        const fullPath = [...cellBasePath, ...(p.path ?? [])]
        const pathStr = pathToString(fullPath)

        // Convert Sanity patch format to operations API format
        if (p.type === 'set') return {set: {[pathStr]: p.value}}
        if (p.type === 'setIfMissing') return {setIfMissing: {[pathStr]: p.value}}
        if (p.type === 'unset') return {unset: [pathStr]}
        if (p.type === 'insert') return {insert: {[p.position]: pathStr, items: p.items}}
        if (p.type === 'diffMatchPatch') return {diffMatchPatch: {[pathStr]: p.value}}
        return p
      })

      // Execute patches directly on the document
      patch?.execute(rewrittenPatches)
    },
  }

  const showEditButton = !tableReadOnly && isSelected && !isEditing

  const cellContent = member ? (
    <>
      {showEditButton && onEditClick && (
        <EditButton
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onEditClick()
          }}
          aria-label="Edit cell"
          title="Edit cell (or press Enter)"
        >
          <EditIcon style={{width: 14, height: 14}} />
        </EditButton>
      )}
      <CellContent $isEditing={isEditing} $rowHasEditingCell={rowHasEditingCell}>
        <MemberField
          member={member}
          renderInput={(inputProps) => {
            if (!isEditing) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return renderInput({...inputProps, readOnly: true} as any)
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const schemaType = inputProps.schemaType as any
            const isPTE =
              schemaType?.jsonType === 'array' &&
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              schemaType?.of?.some((m: any) => m.name === 'block')
            return isPTE ? (
              <PortableTextInput {...(inputProps as PortableTextInputProps)} />
            ) : (
              renderInput(inputProps)
            )
          }}
          renderField={(fieldProps) => {
            // In preview mode or for top-level 'content' field, hide the label
            if (!isEditing || fieldProps.name === 'content') {
              return fieldProps.children
            }
            return renderField(fieldProps)
          }}
          {...otherRenderProps}
        />
      </CellContent>
    </>
  ) : (
    // Empty cell placeholder - show nothing, min-height ensures cell is clickable
    <Box style={{minHeight: 24}} />
  )

  const wrapper = (
    <CellCard
      border
      radius={1}
      padding={2}
      $isSelected={isSelected}
      $isEditing={isEditing}
      $readOnly={tableReadOnly}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onKeyDown={onKeyDown}
      tabIndex={tabIndex}
      data-cell-key={cellKey}
      role="cell"
      aria-selected={isSelected}
      aria-label={cellLabel}
    >
      {cellContent}
    </CellCard>
  )

  /**
   * Only wrap with FormCallbacksProvider when in edit mode.
   *
   * This is a performance optimization:
   * - Non-editing cells render just the wrapper (no provider overhead)
   * - Only the single editing cell gets the FormCallbacksProvider
   * - Since only one cell can edit at a time, we never have multiple providers
   */
  if (!isEditing) {
    return wrapper
  }

  return <FormCallbacksProvider {...patchedCallbacks}>{wrapper}</FormCallbacksProvider>
}

export default PortableTextCell
