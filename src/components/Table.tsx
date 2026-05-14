import {Card, Flex, Inline, Switch, Text} from '@sanity/ui'
import {ChangeEvent, ComponentType, Fragment, useMemo} from 'react'
import {
  ArrayOfObjectsFormNode,
  ArrayOfObjectsItemMember,
  FieldMember,
  ObjectArrayFormNode,
  ObjectFormNode,
  ObjectInputProps,
  ObjectItem,
  OperationsAPI,
  pathToString,
} from 'sanity'

import {useCellNavigation} from '../hooks/useCellNavigation'
import {useToggleTitles} from '../hooks/useToggleTitles'
import {RichTableCellType} from '../schemas/cell.object'
import {ColumnHeader} from '../schemas/columnHeader.object'
import {RichTableType} from '../schemas/richTable.object'
import {RichTableRowType} from '../schemas/row.object'
import {getCellBasePath, getCellMember} from '../utils/cellUtils'
import ColumnContextMenu from './ColumnContextMenu'
import ColumnHeaderWithInput from './ColumnHeaderWithInput'
import PortableTextCell from './PortableTextCell'
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

const Table: ComponentType<TableProps> = ({
  isInDialog = false,
  value,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChange: _onChange,
  patch,
  id,
  ...props
}) => {
  const path = pathToString(props.path)
  const tableId = id ?? `rich-table-${path}`
  // * Prepare members
  const tableObjectMembers = props.members as FieldMember[]

  const rowsFieldMember = tableObjectMembers?.find(
    (member) => member.name === 'rows',
  ) as FieldMember<ArrayOfObjectsFormNode<Array<RichTableRowType>>>

  const rowFieldMembers = rowsFieldMember?.field.members

  const rowMembersWithCellMembers = useMemo(
    () =>
      rowFieldMembers?.map((rowI) => {
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
    [rowFieldMembers],
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

  // Cell selection and keyboard navigation
  const totalRows = value?.rows?.length ?? 0
  const totalCols = value?.columnHeaders?.length ?? 0
  const {
    selectedCellKey,
    editingCellKey,
    setSelectedCellKey,
    setEditingCellKey,
    handleKeyDown,
    getCellLabel,
    makeCellKey,
  } = useCellNavigation({totalRows, totalCols, readOnly: props.readOnly})

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
                const contentMember = getCellMember(rowMembersWithCellMembers, rowIndex, cellIndex)
                const cellKey = makeCellKey(rowIndex, cellIndex)
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
                    <PortableTextCell
                      {...props}
                      member={contentMember}
                      isSelected={selectedCellKey === cellKey}
                      isEditing={isEditing}
                      tableReadOnly={props.readOnly}
                      cellBasePath={getCellBasePath(contentMember)}
                      patch={patch}
                      onClick={(e) => {
                        if (!props.readOnly) {
                          if (editingCellKey && editingCellKey !== cellKey) {
                            setEditingCellKey(null)
                          }
                          if (!isEditing) {
                            setSelectedCellKey(cellKey)
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
                      cellKey={cellKey}
                      cellLabel={cellLabel}
                      onEditClick={() => setEditingCellKey(cellKey)}
                    />
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
