import {Card, Flex, Inline, Switch, Text} from '@sanity/ui'
import {
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
  InputProps,
  ObjectArrayFormNode,
  ObjectFormNode,
  ObjectInputProps,
  ObjectItem,
  ObjectMember,
  OperationsAPI,
  PortableTextInput,
  PortableTextInputProps,
  pathToString,
} from 'sanity'

import {useToggleTitles} from '../hooks/useToggleTitles'
import {RichTableCellType} from '../schemas/cell.object'
import {ColumnHeader} from '../schemas/columnHeader.object'
import {RichTableType} from '../schemas/richTable.object'
import {RichTableRowType} from '../schemas/row.object'
import CellEditDialog from './CellEditDialog'
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

interface CellPosition {
  rowIndex: number
  cellIndex: number
  cellKey: string
}

const toPlainText = (blocks: any[]) =>
  blocks
    .filter((b) => b._type === 'block' && Array.isArray(b.children))
    .map((b) => b.children.map((c: any) => c.text ?? '').join(''))
    .join('\n')

const getColumnLabel = (index: number) => {
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
  onChange: onChangeProp,
  patch,
  id,
  ...props
}) => {
  const path = pathToString(props.path)
  const tableId = id ?? `rich-table-${path}`

  // Wrap onChange to log all patches — helps debug path issues
  const onChange = useCallback(
    (...args: Parameters<typeof onChangeProp>) => {
      console.log('[Table onChange]', JSON.stringify(args))
      return onChangeProp(...args)
    },
    [onChangeProp],
  )

  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null)
  const [editingPosition, setEditingPosition] = useState<CellPosition | null>(null)

  const tableObjectMembers = props.members as FieldMember[]

  const rowsFieldMember = tableObjectMembers?.find(
    (member) => member.name === 'rows',
  ) as FieldMember<ArrayOfObjectsFormNode<Array<RichTableRowType>>>

  const rowKeys = value?.rows?.map((r) => r._key).join(',') ?? ''

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const totalRows = value?.rows?.length ?? 0
  const totalCols = value?.columnHeaders?.length ?? 0

  const getCellMember = useCallback(
    (rowIndex: number, cellIndex: number): FieldMember | undefined => {
      const row = rowMembersWithCellMembers?.[rowIndex]
      if (!row) return undefined
      const cellMember = row.cellMembers?.[cellIndex]
      if (!cellMember) return undefined
      const cellItem = cellMember.item
      const member = (cellItem.members as ObjectMember[])?.find(
        (m): m is FieldMember => m.kind === 'field' && m.name === 'content',
      )
      console.log(
        '[cell member names]',
        (cellItem.members as ObjectMember[])?.map((m) => (m.kind === 'field' ? m.name : m.kind)),
      )
      console.log(
        '[getCellMember] member.field.schemaType.typeName:',
        (member?.field as any)?.schemaType?.typeName,
      )
      console.log(
        '[getCellMember] member.field.schemaType.jsonType:',
        (member?.field as any)?.schemaType?.jsonType,
      )
      console.log(
        '[getCellMember] member.field.schemaType.of[0].jsonType:',
        (member?.field as any)?.schemaType?.of?.[0]?.jsonType,
      )
      console.log(
        '[getCellMember] member.field.schemaType.of[0].type?.jsonType:',
        (member?.field as any)?.schemaType?.of?.[0]?.type?.jsonType,
      )
      return member
    },
    [rowMembersWithCellMembers],
  )

  const getCellLabel = useCallback((rowIndex: number, cellIndex: number): string => {
    return `Cell ${getColumnLabel(cellIndex)}${rowIndex + 1}`
  }, [])

  const handleNavigate = useCallback((pos: CellPosition) => {
    setEditingPosition(pos)
    setSelectedCellKey(pos.cellKey)
  }, [])

  return (
    <Card padding={3} border radius={2} as="section" aria-label="Rich table">
      {editingPosition && (
        <CellEditDialog
          position={editingPosition}
          totalRows={totalRows}
          totalCols={totalCols}
          getCellMember={getCellMember}
          getCellLabel={getCellLabel}
          renderField={props.renderField}
          renderItem={props.renderItem}
          renderPreview={props.renderPreview}
          renderInlineBlock={props.renderInlineBlock}
          renderAnnotation={props.renderAnnotation}
          renderBlock={props.renderBlock}
          renderInput={(inputProps: PortableTextInputProps) => {
            const schemaType = inputProps.schemaType as any
            const isPTE =
              schemaType?.jsonType === 'array' &&
              schemaType?.of?.some((m: any) => m.name === 'block')

            if (!isPTE) {
              // Let the default form handle non-PTE inputs (object block edit forms etc)
              return props.renderInput(inputProps)
            }

            // Forward elementProps for correct focus handling
            return (
              <span tabIndex={0}>
                <PortableTextInput {...inputProps} {...inputProps.elementProps} />
              </span>
            )
          }}
          onClose={() => setEditingPosition(null)}
          onNavigate={handleNavigate}
          patch={patch}
        />
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
                const cellKey = `${rowIndex}-${cellIndex}`
                const safeId = `cell-${cellKey}`
                const isSelected = selectedCellKey === cellKey
                const isEditing = editingPosition?.cellKey === cellKey

                const plainText = cellItem.value?.content ? toPlainText(cellItem.value.content) : ''

                return (
                  <div key={cellKey} id={safeId} role="cell" style={{minWidth: 0, minHeight: 0}}>
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

                    <div
                      tabIndex={props.readOnly ? -1 : 0}
                      onClick={() => !props.readOnly && setSelectedCellKey(cellKey)}
                      onDoubleClick={() => {
                        if (props.readOnly) return
                        setSelectedCellKey(cellKey)
                        setEditingPosition({rowIndex, cellIndex, cellKey})
                      }}
                      onKeyDown={(e) => {
                        if (props.readOnly) return
                        if (e.key === 'Enter' || e.key === 'F2') {
                          e.preventDefault()
                          setEditingPosition({rowIndex, cellIndex, cellKey})
                        }
                        if (e.key === 'Tab') {
                          e.preventDefault()
                          const nextCell = e.shiftKey ? cellIndex - 1 : cellIndex + 1
                          if (nextCell >= 0 && nextCell < totalCols) {
                            setSelectedCellKey(`${rowIndex}-${nextCell}`)
                          } else if (!e.shiftKey && rowIndex < totalRows - 1) {
                            setSelectedCellKey(`${rowIndex + 1}-0`)
                          } else if (e.shiftKey && rowIndex > 0) {
                            setSelectedCellKey(`${rowIndex - 1}-${totalCols - 1}`)
                          }
                        }
                        if (e.key === 'Escape') setSelectedCellKey(null)
                      }}
                      style={{
                        minHeight: 32,
                        padding: '4px 8px',
                        cursor: props.readOnly ? 'default' : 'pointer',
                        outline:
                          isEditing || isSelected
                            ? '2px solid var(--card-focus-ring-color)'
                            : '2px solid transparent',
                        outlineOffset: -2,
                        borderRadius: 2,
                        color: plainText ? 'inherit' : 'var(--card-muted-fg-color)',
                        fontSize: 'inherit',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        userSelect: 'none',
                      }}
                      aria-label={getCellLabel(rowIndex, cellIndex)}
                      aria-selected={isSelected}
                    >
                      {plainText || '—'}
                    </div>
                  </div>
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
