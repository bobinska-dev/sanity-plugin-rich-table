import {EditIcon} from '@sanity/icons'
import {Card, Flex, Inline, Switch, Text} from '@sanity/ui'
import React, {
  ChangeEvent,
  ComponentType,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  ArrayOfObjectsFormNode,
  ArrayOfObjectsItemMember,
  FieldMember,
  FormCallbacksProvider,
  MemberField,
  ObjectArrayFormNode,
  ObjectFormNode,
  ObjectInputProps,
  ObjectItem,
  ObjectMember,
  OperationsAPI,
  PortableTextInput,
  PortableTextInputProps,
  pathToString,
  useFormCallbacks,
} from 'sanity'
import {styled} from 'styled-components'

import {useToggleTitles} from '../hooks/useToggleTitles'
import {RichTableCellType} from '../schemas/cell.object'
import {ColumnHeader} from '../schemas/columnHeader.object'
import {RichTableType} from '../schemas/richTable.object'
import {RichTableRowType} from '../schemas/row.object'
import ColumnContextMenu from './ColumnContextMenu'
import ColumnHeaderWithInput from './ColumnHeaderWithInput'
import RowContextMenu from './RowContextMenu'
import RowHeaderWithInput from './RowHeaderWithInput'
import TableButtons from './TableButtons'
import TableGrid from './TableGrid'
import TableScrollWrapper from './TableScrollWrapper'

type TableProps = ObjectInputProps<RichTableType> & {
  isInDialog?: boolean
  patch: OperationsAPI['patch']
  id?: string
}

// Styled edit button for cell selection
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

  &:hover {
    background: #f0f6ff;
  }

  &:focus {
    outline: 2px solid #2276fc;
    outline-offset: 2px;
  }
`

// Styled wrapper that makes preview non-interactive and hides toolbar
const CellPreviewWrapper = styled.div`
  pointer-events: none;
  font-size: 0.875rem;
  max-height: 100px;
  overflow: hidden !important;

  /* Hide any scrollbars */
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }

  /* Hide the PTE toolbar */
  [data-testid='pt-editor__toolbar-card'] {
    display: none !important;
  }

  /* Make all children non-interactive */
  * {
    pointer-events: none !important;
    user-select: none !important;
  }
`

// Simple read-only cell preview - no FormCallbacksProvider needed since it's non-interactive
const CellPreview: ComponentType<{
  member: FieldMember
  renderInput: ObjectInputProps['renderInput']
  renderField: ObjectInputProps['renderField']
  renderItem: ObjectInputProps['renderItem']
  renderPreview: ObjectInputProps['renderPreview']
  renderBlock: ObjectInputProps['renderBlock']
  renderInlineBlock: ObjectInputProps['renderInlineBlock']
  renderAnnotation: ObjectInputProps['renderAnnotation']
}> = ({
  member,
  renderInput,
  renderField,
  renderItem,
  renderPreview,
  renderBlock,
  renderInlineBlock,
  renderAnnotation,
}) => {
  return (
    <CellPreviewWrapper>
      <MemberField
        member={member}
        renderInput={(inputProps) => renderInput({...inputProps, readOnly: true} as any)}
        renderField={(fieldProps) => fieldProps.children}
        renderItem={renderItem}
        renderPreview={renderPreview}
        renderBlock={renderBlock}
        renderInlineBlock={renderInlineBlock}
        renderAnnotation={renderAnnotation}
      />
    </CellPreviewWrapper>
  )
}

// Editable cell - wraps MemberField with FormCallbacksProvider for path rewriting
const CellEdit: ComponentType<{
  member: FieldMember
  cellBasePath: any[]
  patch: OperationsAPI['patch']
  renderInput: ObjectInputProps['renderInput']
  renderField: ObjectInputProps['renderField']
  renderItem: ObjectInputProps['renderItem']
  renderPreview: ObjectInputProps['renderPreview']
  renderBlock: ObjectInputProps['renderBlock']
  renderInlineBlock: ObjectInputProps['renderInlineBlock']
  renderAnnotation: ObjectInputProps['renderAnnotation']
}> = ({
  member,
  cellBasePath,
  patch,
  renderInput,
  renderField,
  renderItem,
  renderPreview,
  renderBlock,
  renderInlineBlock,
  renderAnnotation,
}) => {
  const parentCallbacks = useFormCallbacks()

  // Only override onChange to rewrite paths
  const patchedCallbacks = {
    ...parentCallbacks,
    onChange: (event: any) => {
      if (!event?.patches) {
        parentCallbacks.onChange?.(event)
        return
      }
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
      patch.execute(rewrittenPatches)
    },
  }

  return (
    <FormCallbacksProvider {...patchedCallbacks}>
      <MemberField
        member={member}
        renderInput={(inputProps: PortableTextInputProps) => {
          const schemaType = inputProps.schemaType as any
          const isPTE =
            schemaType?.jsonType === 'array' && schemaType?.of?.some((m: any) => m.name === 'block')
          if (!isPTE) {
            return renderInput(inputProps)
          }
          return <PortableTextInput {...inputProps} />
        }}
        renderField={(fieldProps) => {
          // Only hide the label for the top-level 'content' field, keep labels for nested fields
          if (fieldProps.name === 'content') {
            return fieldProps.children
          }
          return renderField(fieldProps)
        }}
        renderItem={renderItem}
        renderPreview={renderPreview}
        renderBlock={renderBlock}
        renderInlineBlock={renderInlineBlock}
        renderAnnotation={renderAnnotation}
      />
    </FormCallbacksProvider>
  )
}

// Get column label (A, B, C... AA, AB, etc.)
const getColumnLabel = (index: number): string => {
  let label = ''
  let i = index
  do {
    label = String.fromCharCode(65 + (i % 26)) + label
    i = Math.floor(i / 26) - 1
  } while (i >= 0)
  return label
}

const Table: ComponentType<TableProps> = ({
  isInDialog = false,
  value,
  onChange,
  patch,
  id,
  ...props
}) => {
  const path = pathToString(props.path)
  const tableId = id ?? `rich-table-${path}`

  const tableObjectMembers = props.members as FieldMember[]

  const rowsFieldMember = tableObjectMembers?.find(
    (member) => member.name === 'rows',
  ) as FieldMember<ArrayOfObjectsFormNode<Array<RichTableRowType>>>

  const rowMembersWithCellMembers = useMemo(
    () =>
      rowsFieldMember?.field.members.map((rowI) => {
        const row = rowI as ArrayOfObjectsItemMember<ObjectArrayFormNode<RichTableRowType>>
        const rowItem = row.item
        const rowItemObjectMembers = rowItem.members as FieldMember<
          ObjectFormNode<Array<RichTableCellType>>
        >[]
        const cellsFieldMember = rowItemObjectMembers?.find(
          (member) => member.name === 'cells',
        )?.field
        return {
          rowMember: row,
          cellMembers: cellsFieldMember?.members as
            | ArrayOfObjectsItemMember<ObjectArrayFormNode<RichTableCellType>>[]
            | undefined,
        }
      }),
    [rowsFieldMember],
  )

  const columnHeaderFieldMember = tableObjectMembers?.find(
    (member) => member.name === 'columnHeaders',
  ) as FieldMember<ArrayOfObjectsFormNode<Array<ColumnHeader & ObjectItem>>>

  const columnHeaderMembers = columnHeaderFieldMember?.field.members as ArrayOfObjectsItemMember<
    ObjectArrayFormNode<ColumnHeader & ObjectItem>
  >[]

  const {hasColumnTitles, hasRowTitles} = value!
  const {toggleColumnTitles, toggleRowTitles} = useToggleTitles(
    hasColumnTitles,
    hasRowTitles,
    patch,
    path,
  )

  // State for cell editing
  const [editingCellKey, setEditingCellKey] = useState<string | null>(null)
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null)

  const totalRows = value?.rows?.length ?? 0
  const totalCols = value?.columnHeaders?.length ?? 0

  // Parse cell key to get row and cell indices
  const parseCellKey = useCallback((key: string | null): {row: number; col: number} | null => {
    if (!key) return null
    const [row, col] = key.split('-').map(Number)
    return {row, col}
  }, [])

  // Create cell key from indices
  const makeCellKey = useCallback((row: number, col: number): string => `${row}-${col}`, [])

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Escape: close editing or deselect
      if (e.key === 'Escape') {
        e.stopPropagation() // Prevent bubbling to parent (Sanity form navigation)
        e.preventDefault()
        if (editingCellKey) {
          setEditingCellKey(null)
        } else if (selectedCellKey) {
          setSelectedCellKey(null)
        }
        return
      }

      // Don't intercept keyboard when editing - let inputs handle their own events
      if (editingCellKey) return

      // Only handle navigation when the cell Card itself is focused, not child elements
      const target = e.target as HTMLElement
      const cellCard = e.currentTarget as HTMLElement
      if (target !== cellCard) return

      const current = parseCellKey(selectedCellKey)
      if (!current) return

      let newRow = current.row
      let newCol = current.col

      // Arrow key navigation
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        newCol = Math.max(0, current.col - 1)
      } else if (e.key === 'ArrowRight' || e.key === 'Tab') {
        e.preventDefault()
        if (current.col < totalCols - 1) {
          newCol = current.col + 1
        } else if (e.key === 'Tab' && current.row < totalRows - 1) {
          // Tab wraps to next row
          newRow = current.row + 1
          newCol = 0
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        newRow = Math.max(0, current.row - 1)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        newRow = Math.min(totalRows - 1, current.row + 1)
      } else if (e.key === 'Enter') {
        // Enter to start editing
        e.preventDefault()
        setEditingCellKey(selectedCellKey)
        return
      } else {
        return
      }

      if (newRow !== current.row || newCol !== current.col) {
        setSelectedCellKey(makeCellKey(newRow, newCol))
      }
    },
    [editingCellKey, selectedCellKey, parseCellKey, makeCellKey, totalRows, totalCols],
  )

  // Get the content field member for a cell
  const getCellMember = useCallback(
    (rowIndex: number, cellIndex: number): FieldMember | undefined => {
      const row = rowMembersWithCellMembers?.[rowIndex]
      if (!row) return undefined
      const cellMember = row.cellMembers?.[cellIndex]
      if (!cellMember) return undefined
      const cellItem = cellMember.item
      return (cellItem.members as ObjectMember[])?.find(
        (m): m is FieldMember => m.kind === 'field' && m.name === 'content',
      )
    },
    [rowMembersWithCellMembers],
  )

  // Get cell base path (without 'content') for path rewriting
  const getCellBasePath = useCallback(
    (rowIndex: number, cellIndex: number): any[] => {
      const member = getCellMember(rowIndex, cellIndex)
      return member?.field?.path?.slice(0, -1) ?? []
    },
    [getCellMember],
  )

  // Get cell label (e.g., "Cell A1")
  const getCellLabel = useCallback((rowIndex: number, cellIndex: number): string => {
    return `Cell ${getColumnLabel(cellIndex)}${rowIndex + 1}`
  }, [])

  // Focus the selected cell when it changes (for keyboard navigation)
  useEffect(() => {
    if (selectedCellKey && !editingCellKey) {
      const cell = document.querySelector(`[data-cell-key="${selectedCellKey}"]`) as HTMLElement
      cell?.focus()
    }
  }, [selectedCellKey, editingCellKey])

  return (
    <Card padding={3} border radius={2} as="section" aria-label="Rich table">
      {/* Info hint for editing */}
      {!props.readOnly && !editingCellKey && (
        <Flex paddingBottom={2}>
          <Text size={0} muted>
            Click to select, double-click or Enter to edit. Arrow keys to navigate, Escape to
            deselect.
          </Text>
        </Flex>
      )}

      <TableButtons
        path={path}
        value={value!}
        patch={patch}
        readOnly={props.readOnly}
        tableId={tableId}
      >
        <TableScrollWrapper>
          <TableGrid
            id={tableId}
            $rowCount={value?.rows?.length || 0}
            $columnCount={value?.columnHeaders?.length ? value?.columnHeaders?.length + 1 : 0}
            $isInDialog={false}
            $hasRowTitles={hasRowTitles}
            role="table"
          >
            {/* Placeholder for row title column */}
            <div className={'placeholder-cell'} />

            {/* HEADER ROW */}
            {columnHeaderMembers?.map((colHeaderMember, columnIndex) => {
              const colHeaderItem = colHeaderMember.item.value
              return (
                <Fragment key={colHeaderItem._key}>
                  {hasColumnTitles && (
                    <ColumnHeaderWithInput
                      columnHeader={colHeaderItem}
                      patch={patch}
                      value={value!}
                      path={path}
                      key={colHeaderItem._key}
                      columnIndex={columnIndex}
                      rowCount={value?.rows?.length || 0}
                      columnCount={value?.columnHeaders?.length || 0}
                      readOnly={props.readOnly}
                      role="columnheader"
                    />
                  )}
                  {!hasColumnTitles && (
                    <ColumnContextMenu
                      key={colHeaderItem._key}
                      columnIndex={columnIndex}
                      columnHeaderKey={colHeaderItem._key}
                      patch={patch}
                      value={value!}
                      path={path}
                      rowCount={value?.rows?.length || 0}
                      columnCount={value?.columnHeaders?.length || 0}
                      iconHorizontal
                      readOnly={props.readOnly}
                      role="columnheader"
                    />
                  )}
                </Fragment>
              )
            })}

            {/* CONTENT ROWS AND CELLS */}
            {rowMembersWithCellMembers?.map(({rowMember, cellMembers}, rowIndex) =>
              cellMembers?.map((cellMember, cellIndex) => {
                const cellItem = cellMember.item
                const contentMember = getCellMember(rowIndex, cellIndex)
                const cellKey = `${rowIndex}-${cellIndex}`
                const cellLabel = getCellLabel(rowIndex, cellIndex)
                const isEditing = editingCellKey === cellKey

                return (
                  <Fragment key={cellItem.id}>
                    {/* ROW HEADER / CONTEXT MENU (first column) */}
                    {cellIndex === 0 && hasRowTitles && (
                      <RowHeaderWithInput
                        row={rowMember.item.value}
                        patch={patch}
                        rowIndex={rowIndex}
                        rowCount={value?.rows?.length || 0}
                        path={path}
                        readOnly={props.readOnly}
                        role="rowheader"
                      />
                    )}
                    {cellIndex === 0 && !hasRowTitles && (
                      <RowContextMenu
                        rowIndex={rowIndex}
                        rowCount={value?.rows?.length || 0}
                        row={rowMember.item.value}
                        patch={patch}
                        path={path}
                        readOnly={props.readOnly}
                        role="rowheader"
                      />
                    )}

                    {/* CELL CONTENT */}
                    <Card
                      border
                      radius={1}
                      padding={2}
                      style={{
                        minWidth: 0,
                        minHeight: 32,
                        maxHeight: 120,
                        overflow: 'hidden',
                        cursor: props.readOnly ? 'default' : 'pointer',
                        outline: isEditing
                          ? '2px solid #2276fc'
                          : selectedCellKey === cellKey
                            ? '2px solid #2276fc'
                            : '2px solid transparent',
                        outlineOffset: -2,
                        transition: 'outline-color 0.15s ease',
                        position: 'relative',
                      }}
                      onClick={(e) => {
                        if (!props.readOnly) {
                          // Close current editing cell when selecting a different cell
                          if (editingCellKey && editingCellKey !== cellKey) {
                            setEditingCellKey(null)
                          }
                          // Only update selection and focus if not already editing this cell
                          if (!isEditing) {
                            setSelectedCellKey(cellKey)
                            // Focus the cell so keyboard events work
                            ;(e.currentTarget as HTMLElement).focus()
                          }
                        }
                      }}
                      onDoubleClick={() => {
                        if (!props.readOnly) {
                          setEditingCellKey(cellKey)
                        }
                      }}
                      onKeyDown={handleKeyDown}
                      tabIndex={selectedCellKey === cellKey || isEditing ? 0 : -1}
                      data-cell-key={cellKey}
                      // @ts-expect-error role prop needed for accessibility
                      role="cell"
                      aria-selected={selectedCellKey === cellKey}
                      aria-label={cellLabel}
                    >
                      {/* Edit icon shown when selected but not editing */}
                      {!props.readOnly && selectedCellKey === cellKey && !isEditing && (
                        <EditButton
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingCellKey(cellKey)
                          }}
                          aria-label="Edit cell"
                          title="Edit cell (or press Enter)"
                        >
                          <EditIcon style={{width: 14, height: 14}} />
                        </EditButton>
                      )}
                      {contentMember ? (
                        isEditing ? (
                          <CellEdit
                            member={contentMember}
                            cellBasePath={getCellBasePath(rowIndex, cellIndex)}
                            patch={patch}
                            renderInput={props.renderInput}
                            renderField={props.renderField}
                            renderItem={props.renderItem}
                            renderPreview={props.renderPreview}
                            renderBlock={props.renderBlock}
                            renderInlineBlock={props.renderInlineBlock}
                            renderAnnotation={props.renderAnnotation}
                          />
                        ) : (
                          <CellPreview
                            member={contentMember}
                            renderInput={props.renderInput}
                            renderField={props.renderField}
                            renderItem={props.renderItem}
                            renderPreview={props.renderPreview}
                            renderBlock={props.renderBlock}
                            renderInlineBlock={props.renderInlineBlock}
                            renderAnnotation={props.renderAnnotation}
                          />
                        )
                      ) : (
                        <Text size={1} muted>
                          —
                        </Text>
                      )}
                    </Card>
                  </Fragment>
                )
              }),
            )}
          </TableGrid>
        </TableScrollWrapper>
      </TableButtons>

      {isInDialog && (
        <Flex gap={3} justify={'flex-end'} align={'center'} paddingTop={3}>
          <Inline space={2}>
            <Text as={'label'} htmlFor={'row-title-toggle'} size={0} muted>
              Show row titles
            </Text>
            <Switch
              checked={hasRowTitles}
              role="switch"
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                toggleRowTitles(e.currentTarget.checked)
              }
              id={'row-title-toggle'}
              aria-controls={tableId}
            />
          </Inline>
          <Inline space={2}>
            <Text as={'label'} htmlFor={'column-title-toggle'} size={0} muted>
              Show column titles
            </Text>
            <Switch
              checked={hasColumnTitles}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                toggleColumnTitles(e.currentTarget.checked)
              }
              id={'column-title-toggle'}
              aria-controls={tableId}
            />
          </Inline>
        </Flex>
      )}
    </Card>
  )
}

export default Table
