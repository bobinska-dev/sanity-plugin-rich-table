import {Card, Flex, Inline, Switch, Text} from '@sanity/ui'
import React, {ChangeEvent, ComponentType, Fragment, useCallback, useMemo, useState} from 'react'
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

// Styled wrapper that makes preview non-interactive and hides toolbar
const CellPreviewWrapper = styled.div`
  pointer-events: none;
  font-size: 0.875rem;
  max-height: 100px;
  overflow: hidden;

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

  // Close editing on Escape key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && editingCellKey) {
        setEditingCellKey(null)
      }
    },
    [editingCellKey],
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

  return (
    <Card padding={3} border radius={2} as="section" aria-label="Rich table">
      {/* Info hint for editing */}
      {!props.readOnly && !editingCellKey && (
        <Flex paddingBottom={2}>
          <Text size={0} muted>
            Double-click a cell to edit. Press Escape to close.
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
                        maxHeight: isEditing ? 'none' : 120,
                        overflow: isEditing ? 'visible' : 'hidden',
                        cursor: props.readOnly ? 'default' : 'pointer',
                        outline: isEditing
                          ? '2px solid #2276fc'
                          : selectedCellKey === cellKey
                            ? '2px solid #2276fc'
                            : '2px solid transparent',
                        outlineOffset: -2,
                        transition: 'outline-color 0.15s ease',
                        zIndex: isEditing ? 10 : 'auto',
                        position: isEditing ? 'relative' : 'static',
                      }}
                      onClick={() => {
                        if (!props.readOnly && !isEditing) {
                          setSelectedCellKey(cellKey)
                        }
                      }}
                      onDoubleClick={() => {
                        if (!props.readOnly && !isEditing) {
                          setEditingCellKey(cellKey)
                        }
                      }}
                      onKeyDown={handleKeyDown}
                      tabIndex={isEditing ? 0 : undefined}
                      // @ts-expect-error role prop needed for accessibility
                      role="cell"
                      aria-selected={selectedCellKey === cellKey}
                      aria-label={cellLabel}
                    >
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
