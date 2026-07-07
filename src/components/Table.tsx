import {PatchOperations} from '@sanity/types'
import {Card, Flex, Inline, Switch, Text} from '@sanity/ui'
import {ChangeEvent, ComponentType, Fragment, useState} from 'react'
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
import {styled} from 'styled-components'

import {useTableCellValidation} from '../hooks/useTableCellValidation'
import {useToggleTitles} from '../hooks/useToggleTitles'
import ContentPortableTextInput from '../portable-text/ContentPortableTextEditor'
import {RichTableCellType} from '../schemas/cell.object'
import {ColumnHeader} from '../schemas/columnHeader.object'
import {RichTableType} from '../schemas/richTable.object'
import {RichTableRowType} from '../schemas/row.object'
import ColumnContextMenu from './ColumnContextMenu'
import ColumnHeaderWithInput from './ColumnHeaderWithInput'
import ColumnResizeHandle from './ColumnResizeHandle'
import {RichTableErrorBoundary} from './RichTableErrorBoundary'
import RowContextMenu from './RowContextMenu'
import RowHeaderWithInput from './RowHeaderWithInput'
import TableButtons from './TableButtons'
import TableGrid from './TableGrid'
import TableScrollWrapper from './TableScrollWrapper'

// Wraps a column header so the resize handle can sit absolutely in a right-hand
// gutter without overlapping the header's context-menu button. Also used for the
// top-left placeholder, which carries the row-title column's resize handle.
const ColumnHeaderCell = styled.div`
  position: relative;
  min-width: 0;
  padding-inline-end: 8px;
`

// Sentinel width key for the row-title column, which is stored table-level
// (`rowTitleWidth`) rather than on a `columnHeader`. Prefixed so it can't collide
// with a generated column `_key`.
const ROW_TITLE_KEY = '__rowTitle'

// TODO: make row title / context menu sticky to the left side when scrolling horizontally?
const Table: ComponentType<
  ObjectInputProps<RichTableType> & {
    handleOpen?: () => void
    isInDialog?: boolean
    /** Whether the expanded-editor dialog is currently open for this table. */
    isExpanded?: boolean
    isInPortableText?: boolean
    /** Patch function from Sanity document operations for optimistic changes */
    patch: OperationsAPI['patch']
    id?: string
    portableTextSchemaTypeName?: string
  }
> = ({
  isInDialog = false,
  isExpanded = false,
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

  // The inline table and the expanded dialog are mounted at the same time and
  // share the URL-param-driven promote confirmation. Only the active surface
  // (the dialog when open, else the inline table) renders it, so we don't get
  // two stacked modals fighting for focus.
  const ownsRouteDialog = isInDialog || !isExpanded

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

  // Column widths are stored per header; while dragging we keep an optimistic
  // draft keyed by column so the grid resizes live before the patch lands.
  const [draftWidths, setDraftWidths] = useState<Record<string, number>>({})

  // Reconcile drafts against persisted widths during render (React's "adjust
  // state when a prop changes" pattern — not an effect, since this repo's React
  // Compiler lint forbids setState in effects) so a committed drag doesn't flash
  // back and later external edits (undo, collaboration) take over instead of
  // being masked by a stale draft. Keyed off a signature of the persisted widths
  // (not the members array identity) so it can't loop if that identity churns.
  const persistedWidthSignature = `${value?.rowTitleWidth ?? ''}|${
    columnHeaderMembers
      ?.map((member) => `${member.item.value._key}:${member.item.value.width ?? ''}`)
      .join('|') ?? ''
  }`
  const [reconciledSignature, setReconciledSignature] = useState(persistedWidthSignature)
  if (persistedWidthSignature !== reconciledSignature) {
    setReconciledSignature(persistedWidthSignature)
    setDraftWidths((prev) => {
      if (Object.keys(prev).length === 0) return prev
      const next = {...prev}
      let changed = false
      columnHeaderMembers?.forEach((member) => {
        const {_key, width} = member.item.value
        if (_key in next && next[_key] === width) {
          delete next[_key]
          changed = true
        }
      })
      if (ROW_TITLE_KEY in next && next[ROW_TITLE_KEY] === value?.rowTitleWidth) {
        delete next[ROW_TITLE_KEY]
        changed = true
      }
      return changed ? next : prev
    })
  }

  const columnWidths = columnHeaderMembers?.map(
    (colHeaderMember) =>
      draftWidths[colHeaderMember.item.value._key] ?? colHeaderMember.item.value.width,
  )
  const rowTitleWidth = draftWidths[ROW_TITLE_KEY] ?? value?.rowTitleWidth

  // The in-progress resize, so headers can highlight what's affected: just the
  // dragged column, or every column when Shift ("resize all") is held.
  const [activeResize, setActiveResize] = useState<{columnKey: string; applyToAll: boolean} | null>(
    null,
  )

  // Plain handlers (not `useCallback`) so the React Compiler memoizes them — a
  // manual `useCallback` closing over `columnHeaderMembers` can't be preserved.
  const handleColumnResize = (columnKey: string, width: number, applyToAll: boolean) => {
    // Shift ("resize all") only applies to content columns, never the row-title one.
    const resizeAll = applyToAll && columnKey !== ROW_TITLE_KEY
    // Replace the whole draft each move (rather than merge) so toggling Shift
    // mid-drag cleanly switches between "this column" and "all columns".
    if (resizeAll) {
      const next: Record<string, number> = {}
      columnHeaderMembers?.forEach((member) => {
        next[member.item.value._key] = width
      })
      setDraftWidths(next)
    } else {
      setDraftWidths({[columnKey]: width})
    }
    setActiveResize((prev) =>
      prev?.columnKey === columnKey && prev.applyToAll === resizeAll
        ? prev
        : {columnKey, applyToAll: resizeAll},
    )
  }

  const handleColumnResizeEnd = (columnKey: string, width: number, applyToAll: boolean) => {
    setActiveResize(null)
    if (props.readOnly) return
    // The row-title column stores its width table-level; content columns store it per header.
    if (columnKey === ROW_TITLE_KEY) {
      patch.execute([{set: {[`${path}.rowTitleWidth`]: width}}])
      return
    }
    const keysToSet =
      applyToAll && columnHeaderMembers
        ? columnHeaderMembers.map((member) => member.item.value._key)
        : [columnKey]
    const setPatch: PatchOperations = {
      set: Object.fromEntries(
        keysToSet.map((key) => [`${path}.columnHeaders[_key=="${key}"].width`, width]),
      ),
    }
    patch.execute([setPatch])
  }

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
        <TableScrollWrapper
          tabIndex={0}
          role="group"
          aria-label="Table content, scroll horizontally to see more columns"
        >
          <TableGrid
            id={tableId}
            $rowCount={value?.rows?.length || 0}
            // we need to add one extra column for the row titles / context menu
            $columnCount={value?.columnHeaders?.length ? value?.columnHeaders?.length + 1 : 0}
            $columnWidths={columnWidths}
            $rowTitleWidth={rowTitleWidth}
            $isInDialog={false}
            $hasRowTitles={hasRowTitles}
            role="table"
          >
            {/* HEADER ROW — `display: contents` keeps the CSS-grid layout intact
                while giving assistive tech a real `row` that owns the header cells. */}
            <div role="row" style={{display: 'contents'}}>
              {/* Corner cell above the row titles; carries the row-title column's resize handle */}
              <ColumnHeaderCell
                className={'placeholder-cell'}
                role="presentation"
                data-rt-column-cell
              >
                {hasRowTitles && !props.readOnly && (
                  <ColumnResizeHandle
                    columnKey={ROW_TITLE_KEY}
                    label={'Resize the row-title column'}
                    allowResizeAll={false}
                    active={activeResize?.columnKey === ROW_TITLE_KEY}
                    onResize={handleColumnResize}
                    onResizeEnd={handleColumnResizeEnd}
                  />
                )}
              </ColumnHeaderCell>

              {columnHeaderMembers?.map((colHeaderMember, columnIndex) => {
                const colHeaderItem = colHeaderMember.item.value
                const colValidation = getCellValidation(colHeaderMember.item.path)
                // TODO: force remount when columnHeader value has changed in dialog but not in inline table input -> this is maybe caused by missing blur event in the input👇
                return (
                  <ColumnHeaderCell
                    key={colHeaderItem._key}
                    role="columnheader"
                    data-rt-column-cell
                  >
                    {hasColumnTitles && (
                      <ColumnHeaderWithInput
                        columnHeader={colHeaderItem}
                        patch={patch}
                        value={value!}
                        path={path}
                        columnIndex={columnIndex}
                        rowCount={value?.rows?.length || 0}
                        columnCount={value?.columnHeaders?.length || 0}
                        readOnly={props.readOnly}
                        validationTone={colValidation.tone}
                        tableId={tableId}
                        ownsRouteDialog={ownsRouteDialog}
                      />
                    )}
                    {!hasColumnTitles && (
                      <ColumnContextMenu
                        columnIndex={columnIndex}
                        columnHeaderKey={colHeaderItem._key}
                        patch={patch}
                        value={value!}
                        path={path}
                        rowCount={value?.rows?.length || 0}
                        columnCount={value?.columnHeaders?.length || 0}
                        iconHorizontal
                        readOnly={props.readOnly}
                        tableId={tableId}
                        ownsRouteDialog={ownsRouteDialog}
                      />
                    )}
                    {!props.readOnly && (
                      <ColumnResizeHandle
                        columnKey={colHeaderItem._key}
                        label={`Resize column ${columnIndex + 1}`}
                        active={
                          !!activeResize &&
                          (activeResize.applyToAll || activeResize.columnKey === colHeaderItem._key)
                        }
                        onResize={handleColumnResize}
                        onResizeEnd={handleColumnResizeEnd}
                      />
                    )}
                  </ColumnHeaderCell>
                )
              })}
            </div>

            {/* CONTENT ROWS AND CELLS — one `row` per table row (see note above). */}
            {rowMembersWithCellMembers?.map(({rowMember, cellMembers}, rowIndex) => (
              <div
                role="row"
                style={{display: 'contents'}}
                key={rowMember.item.value?._key ?? rowIndex}
              >
                {cellMembers?.map((cellMember, cellIndex) => {
                  const cellItem = cellMember.item
                  const cellPTEPath = cellItem.path.concat('content')
                  const cellValue = value?.rows?.[rowIndex]?.cells?.[cellIndex]?.content
                  const cellContentSchemaType = cellItem.schemaType.fields.find(
                    (field) => field.name === 'content',
                  ) as ArraySchemaType<PortableTextBlock>
                  const cellValidation = getCellValidation(cellItem.path)
                  // Row-header tone comes from the row's *title* markers only, so a
                  // cell error inside the row doesn't also redden the row header.
                  const rowTitleTone =
                    cellIndex === 0
                      ? getCellValidation(rowMember.item.path.concat('title')).tone
                      : undefined
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
                          validationTone={rowTitleTone}
                          tableId={tableId}
                          value={value!}
                          ownsRouteDialog={ownsRouteDialog}
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
                          tableId={tableId}
                          value={value!}
                          ownsRouteDialog={ownsRouteDialog}
                        />
                      )}
                      {/* PTE CELL CONTENT — wrapped so a render crash in one cell
                          (malformed content, a throwing custom renderer) is
                          contained and doesn't take down the whole table. */}
                      <RichTableErrorBoundary
                        key={cellItem.id}
                        what="cell"
                        title="This cell couldn’t be displayed"
                        role="cell"
                        label={`column ${cellIndex + 1}, row ${rowIndex + 1}`}
                      >
                        <ContentPortableTextInput
                          onChange={onChange}
                          path={cellPTEPath}
                          value={cellValue}
                          readOnly={props.readOnly}
                          schemaType={cellContentSchemaType}
                          role="cell"
                          portableTextSchemaTypeName={portableTextSchemaTypeName}
                          displayInlineChanges={props.displayInlineChanges}
                          validation={cellValidation.markers}
                          validationTone={cellValidation.tone}
                        />
                      </RichTableErrorBoundary>
                    </Fragment>
                  )
                })}
              </div>
            ))}
          </TableGrid>
        </TableScrollWrapper>
      </TableButtons>
      {isInDialog && (
        <Flex gap={3} justify={'flex-end'} align={'center'} paddingTop={3}>
          <Inline space={2}>
            <Text as={'label'} htmlFor={`${tableId}-row-title-toggle`} size={0} muted>
              Show row titles
            </Text>
            <Switch
              checked={hasRowTitles}
              role="switch"
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                toggleRowTitles(e.currentTarget.checked)
              }
              id={`${tableId}-row-title-toggle`}
              aria-controls={tableId}
            />
          </Inline>
          <Inline space={2}>
            <Text as={'label'} htmlFor={`${tableId}-column-title-toggle`} size={0} muted>
              Show column titles
            </Text>
            <Switch
              checked={hasColumnTitles}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                toggleColumnTitles(e.currentTarget.checked)
              }
              id={`${tableId}-column-title-toggle`}
              aria-controls={tableId}
            />
          </Inline>
        </Flex>
      )}
    </Card>
  )
}
export default Table
