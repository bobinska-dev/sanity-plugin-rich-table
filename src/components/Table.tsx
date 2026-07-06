import {Card, Flex, Inline, Switch, Text} from '@sanity/ui'
import {ChangeEvent, ComponentType, Fragment} from 'react'
import {
  ArrayOfObjectsFormNode,
  ArrayOfObjectsItemMember,
  ArraySchemaType,
  FieldMember,
  ObjectArrayFormNode,
  ObjectFormNode,
  ObjectInputProps,
  ObjectItem,
  OperationsAPI,
  pathToString,
  PortableTextBlock,
} from 'sanity'

import {useTableCellValidation} from '../hooks/useTableCellValidation'
import {useToggleTitles} from '../hooks/useToggleTitles'
import ContentPortableTextInput from '../portable-text/ContentPortableTextEditor'
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

// TODO: make row title / context menu sticky to the left side when scrolling horizontally?
const Table: ComponentType<
  ObjectInputProps<RichTableType> & {
    handleOpen?: () => void
    isInDialog?: boolean
    isInPortableText?: boolean
    /** Patch function from Sanity document operations for optimistic changes */
    patch: OperationsAPI['patch']
    id?: string
    portableTextSchemaTypeName?: string
  }
> = ({
  isInDialog = false,
  handleOpen,
  value,
  onChange,
  patch,
  isInPortableText,
  id,
  portableTextSchemaTypeName,
  ...props
}) => {
  // * Prepare the path
  const path = pathToString(props.path)
  const tableId = id ?? `rich-table-${path}`
  // * Prepare members
  const tableObjectMembers = props.members as FieldMember[]

  const rowsFieldMember = tableObjectMembers?.find(
    (member) => member.name === 'rows',
  ) as FieldMember<ArrayOfObjectsFormNode<Array<RichTableRowType>>>

  const rowMembersWithCellMembers = rowsFieldMember?.field.members.map((rowI) => {
    const row = rowI as ArrayOfObjectsItemMember<ObjectArrayFormNode<RichTableRowType>>
    const rowItem = row.item
    const rowItemObjectMembers = rowItem.members as FieldMember<
      ObjectFormNode<Array<RichTableCellType>>
    >[]
    const cellsFieldMember = rowItemObjectMembers?.find((member) => member.name === 'cells')?.field
    return {
      rowMember: row,
      cellMembers: cellsFieldMember?.members as
        | ArrayOfObjectsItemMember<ObjectArrayFormNode<RichTableCellType>>[]
        | undefined,
    }
  })

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

  // Look up validation markers per cell so the custom renderer can surface them
  // inline (native field chrome, which normally draws them, is bypassed here).
  const getCellValidation = useTableCellValidation()

  return (
    <Card
      padding={3}
      border
      radius={2}
      onDoubleClick={() => (isInPortableText && handleOpen?.() ? handleOpen() : undefined)}
      as="section"
      aria-label="Rich table"
    >
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
            // we need to add one extra column for the row titles / context menu
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
              const colValidation = getCellValidation(colHeaderMember.item.path)
              // TODO: force remount when columnHeader value has changed in dialog but not in inline table input -> this is maybe caused by missing blur event in the input👇
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
                      validationTone={colValidation.tone}
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
                const cellPTEPath = cellItem.path.concat('content')
                const cellValue = value?.rows?.[rowIndex]?.cells?.[cellIndex]?.content
                const cellContentSchemaType = cellItem.schemaType.fields.find(
                  (field) => field.name === 'content',
                ) as ArraySchemaType<PortableTextBlock>
                const cellValidation = getCellValidation(cellItem.path)
                return (
                  <Fragment key={cellItem.id}>
                    {/* CONTEXT MENU BUTTON */}
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
                    {/* PTE CELL CONTENT */}
                    <ContentPortableTextInput
                      onChange={onChange}
                      path={cellPTEPath}
                      value={cellValue}
                      key={cellItem.id}
                      readOnly={props.readOnly}
                      schemaType={cellContentSchemaType}
                      // @ts-expect-error role prop not in type but needed for accessibility
                      role="cell"
                      portableTextSchemaTypeName={portableTextSchemaTypeName}
                      displayInlineChanges={props.displayInlineChanges}
                      validation={cellValidation.markers}
                      validationTone={cellValidation.tone}
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
