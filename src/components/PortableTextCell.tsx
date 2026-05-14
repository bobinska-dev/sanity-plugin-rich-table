import {EditIcon} from '@sanity/icons'
import {Card, Text} from '@sanity/ui'
import type {ComponentType, KeyboardEvent, MouseEvent} from 'react'
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
  min-width: 0;
  min-height: 32px;
  align-self: start;
  cursor: ${({$readOnly}) => ($readOnly ? 'default' : 'pointer')};
  outline: 2px solid
    ${({$isSelected, $isEditing}) => ($isSelected || $isEditing ? '#2276fc' : 'transparent')};
  outline-offset: -2px;
  transition: outline-color 0.15s ease;
  position: relative;
  font-size: 0.875rem;

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

// Wrapper for cell content - handles pointer-events and constrains height
const CellContent = styled.div<{$isEditing: boolean}>`
  max-height: 120px;
  overflow: hidden;
  ${({$isEditing}) =>
    !$isEditing &&
    `
    pointer-events: none;
    user-select: none;
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
 */
const PortableTextCell: ComponentType<PortableTextCellProps> = ({
  member,
  isSelected,
  isEditing,
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
  renderInput,
  renderField,
  ...otherRenderProps
}) => {
  const parentCallbacks = useFormCallbacks()

  // Patched callbacks for edit mode - rewrites paths for correct document location
  const patchedCallbacks = {
    ...parentCallbacks,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (event: any) => {
      if (!isEditing || !event?.patches) {
        parentCallbacks.onChange?.(event)
        return
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rewrittenPatches = event.patches.map((p: any) => {
        const fullPath = [...cellBasePath, ...(p.path ?? [])]
        const pathStr = pathToString(fullPath)
        if (p.type === 'set') return {set: {[pathStr]: p.value}}
        if (p.type === 'setIfMissing') return {setIfMissing: {[pathStr]: p.value}}
        if (p.type === 'unset') return {unset: [pathStr]}
        if (p.type === 'insert') return {insert: {[p.position]: pathStr, items: p.items}}
        if (p.type === 'diffMatchPatch') return {diffMatchPatch: {[pathStr]: p.value}}
        return p
      })
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
      <CellContent $isEditing={isEditing}>
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
    <Text size={1} muted>
      —
    </Text>
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

  // Only wrap with FormCallbacksProvider in edit mode
  if (!isEditing) {
    return wrapper
  }

  return <FormCallbacksProvider {...patchedCallbacks}>{wrapper}</FormCallbacksProvider>
}

export default PortableTextCell
