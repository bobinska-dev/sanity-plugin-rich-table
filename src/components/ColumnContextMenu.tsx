import {EllipsisHorizontalIcon, EllipsisVerticalIcon} from '@sanity/icons'
import {PatchOperations} from '@sanity/types'
import {Button, Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui'
import {ComponentType, Fragment, useCallback} from 'react'
import {
  TbArrowBarLeft,
  TbArrowBarRight,
  TbColumnInsertLeft,
  TbColumnInsertRight,
  TbColumnRemove,
  TbLayoutSidebar,
} from 'react-icons/tb'
import {ObjectItem, OperationsAPI} from 'sanity'

import {
  PROMOTE_PARAM,
  promoteDialogParamValue,
  useRouteDialogState,
} from '../hooks/useDialogRouteState'
import {RichTableCellType} from '../schemas/cell.object'
import {ColumnHeader} from '../schemas/columnHeader.object'
import {RichTableType} from '../schemas/richTable.object'
import {createEmptyCell} from '../utils/createEmptyCell'
import {generateKey} from '../utils/generateKey'
import {portableTextToPlain} from '../utils/portableTextToPlain'
import ConfirmPromoteHeaderDialog from './ConfirmPromoteHeaderDialog'

interface ColumnMenuButtonProps {
  columnIndex: number
  columnHeaderKey: string
  /** Patch function from Sanity document operations for optimistic changes */
  patch: OperationsAPI['patch']
  value: RichTableType
  path: string
  rowCount: number
  columnCount: number
  iconHorizontal?: boolean
  readOnly: boolean | undefined
  tableId?: string
  role?: string
  /**
   * Whether this menu's surface should render the (URL-param-driven) promote
   * confirmation. The inline table and the expanded dialog are mounted at once
   * and share the param, so only the active surface renders the dialog to avoid
   * two stacked modals. Defaults to `true`. {@link ../hooks/useDialogRouteState}
   */
  ownsRouteDialog?: boolean
}
const ColumnContextMenu: ComponentType<ColumnMenuButtonProps> = (props) => {
  const {
    patch,
    columnIndex,
    columnHeaderKey,
    path,
    rowCount,
    columnCount,
    value,
    iconHorizontal,
    readOnly,
    role,
    tableId,
    ownsRouteDialog = true,
  } = props
  const columnHeaderPathString = `${path}.columnHeaders[_key=="${columnHeaderKey}"]`
  // Namespace the menu/button ids per table instance so the inline table and the
  // expanded-table dialog don't emit duplicate DOM ids when both are mounted.
  const menuId = `${tableId ? `${tableId}-` : ''}column-menu-${columnHeaderKey}`
  const buttonId = `${menuId}-button`
  // Register the confirmation in the pane's URL params so it's deep-linkable,
  // refresh-persistent, and closable with the browser back button. Keyed by the
  // table path, so gate the dialog render to the first column (below) to avoid
  // every column's menu opening its own copy.
  const {
    open: isPromoteConfirmOpen,
    handleOpen: openPromoteConfirm,
    handleClose: closePromoteConfirm,
  } = useRouteDialogState(PROMOTE_PARAM, promoteDialogParamValue('columnToRowTitles', path))

  // Build (but don't execute) the patches that remove this column: unset its
  // header, unset the matching cell in every row, and decrement the `cellIndex`
  // of every subsequent header. Shared by delete and promote-to-row-titles.
  const buildDeleteColumnPatches = useCallback((): PatchOperations[] => {
    const headerUnsetPatch: PatchOperations = {
      unset: [columnHeaderPathString],
    }
    const cellPathsToUnset = Array.from({length: rowCount || 0}, (_, i) => i).map(
      (rowIndex) => `${path}.rows[${rowIndex}].cells[${columnIndex}]`,
    )
    const cellUnsetPatch: PatchOperations = {
      unset: cellPathsToUnset,
    }
    // compare columnCount with columnIndex to check if the deleted column is the last one, if not we need to decrease the cellIndex of the subsequent columns
    const columnHeaderIndexesToUpdate =
      columnIndex === columnCount - 1
        ? []
        : Array.from({length: columnCount - columnIndex - 1}, (_, i) => i + columnIndex + 1)

    const cellIndexPatches = columnHeaderIndexesToUpdate.map((colHeaderIndex) => {
      const colHeaderPath = `${path}.columnHeaders[${colHeaderIndex - 1}]`
      return {
        dec: {
          [`${colHeaderPath}.cellIndex`]: 1,
        },
      }
    })

    return [headerUnsetPatch, cellUnsetPatch, ...cellIndexPatches]
  }, [rowCount, columnIndex, columnCount, path, columnHeaderPathString])

  const handleDeleteColumn = useCallback(() => {
    return patch.execute(buildDeleteColumnPatches())
  }, [patch, buildDeleteColumnPatches])

  // * Promote this column to be the row titles, then remove it.
  // Each cell's rich content is flattened to plain text (marks/formatting are
  // dropped) and written to the matching row's `title`.
  const handlePromoteToRowTitles = useCallback(() => {
    const rows = value.rows ?? []
    const titlePatches: PatchOperations[] = rows.map((row) => ({
      set: {
        [`${path}.rows[_key=="${row._key}"].title`]: portableTextToPlain(
          row.cells?.[columnIndex]?.content,
        ),
      },
    }))
    const showRowTitlesPatch: PatchOperations = {
      set: {[`${path}.hasRowTitles`]: true},
    }
    return patch.execute([...titlePatches, showRowTitlesPatch, ...buildDeleteColumnPatches()])
  }, [value.rows, path, columnIndex, patch, buildDeleteColumnPatches])

  const handleAddColumn = useCallback(
    (side: 'left' | 'right') => {
      const newColumnIndex = side === 'right' ? columnIndex + 1 : columnIndex
      const newColumnHeader: ColumnHeader & ObjectItem = {
        _type: 'columnHeader',
        cellIndex: newColumnIndex,
        _key: generateKey(),
      }

      // * Patch to add new column header
      const addHeaderPatch: PatchOperations =
        side === 'right'
          ? {
              insert: {
                after: columnHeaderPathString,
                items: [newColumnHeader],
              },
            }
          : {
              insert: {
                before: columnHeaderPathString,
                items: [newColumnHeader],
              },
            }

      const newCellsPaths = Array.from({length: rowCount || 0}, (_, i) => i).map((rowIndex) => {
        // Path to insert the new cell > before and after in patch will handle the rest
        return `${path}.rows[${rowIndex}].cells[${columnIndex}]`
      })

      // * Patches to add new cells in each row
      const addCellPatches = newCellsPaths.map((cellPath) => {
        const direction = side === 'right' ? 'after' : 'before'
        // Template cell item with a fully-keyed Portable Text value.
        const newCellItemWithKey: RichTableCellType = createEmptyCell()
        return {
          insert: {
            [direction]: cellPath,
            items: [newCellItemWithKey],
          },
        }
      })

      // Patches to increase cellIndex of subsequent columns
      const columnHeaderIndexesToUpdate =
        side === 'right'
          ? // if col has been added after, we need to update all columns with index greater than the current one
            Array.from({length: columnCount - (columnIndex + 1)}, (_, i) => i + columnIndex + 1)
          : // if col has been added before, we need to update all columns with index greater than or equal to the current one
            Array.from({length: columnCount - columnIndex}, (_, i) => i + columnIndex)

      const cellIndexPatches = columnHeaderIndexesToUpdate.map((colHeaderIndex) => {
        const colHeaderPath = `${path}.columnHeaders[${colHeaderIndex}]`
        return {
          inc: {
            [`${colHeaderPath}.cellIndex`]: 1,
          },
        }
      })
      // first we move the cellIndexes of the existing columns to make space for the new column
      patch.execute(cellIndexPatches)

      // then we add the new column header and the new cells
      return patch.execute([addHeaderPatch, ...addCellPatches])
    },
    [columnCount, rowCount, columnIndex, path, columnHeaderPathString, patch],
  )

  const handleMoveColumn = useCallback(
    (direction: 'left' | 'right') => {
      // First we store the current column header and cells (with their values) to temporary variables
      const headerToMove = value.columnHeaders?.[columnIndex]
      const headerToPatch = {
        ...headerToMove,
        cellIndex: direction === 'left' ? columnIndex - 1 : columnIndex + 1,
      }
      const cellsToMove = value.rows?.map((row) => ({
        rowKey: row._key,
        cell: row.cells?.[columnIndex],
      }))

      if (direction === 'left') {
        // * Calculate new column index
        const newColumnIndex = columnIndex - 1

        // * Prepare unset patches
        const headerPathToUnset = `${path}.columnHeaders[${columnIndex}]`
        const cellPathsToUnset = cellsToMove?.map(
          (row) => `${path}.rows[_key=="${row.rowKey}"].cells[${columnIndex}]`,
        )

        const unsetPatches: PatchOperations[] = [
          {
            unset: [...(cellPathsToUnset || []), headerPathToUnset],
          },
        ]

        // * Prepare inc patches for other columns
        const colHeaderPath = `${path}.columnHeaders[${columnIndex - 1}]`
        const incPatch: PatchOperations = {
          inc: {
            [`${colHeaderPath}.cellIndex`]: 1,
          },
        }

        // * Prepare insert patches
        const headerInsertPatch: PatchOperations = {
          insert: {
            before: `${path}.columnHeaders[${newColumnIndex}]`,
            items: [headerToPatch!],
          },
        }

        const cellInsertPatches: PatchOperations[] =
          cellsToMove?.map((row) => ({
            insert: {
              before: `${path}.rows[_key=="${row.rowKey}"].cells[${newColumnIndex}]`,
              items: [row.cell!],
            },
          })) || []

        // * Execute all patches in order (do not change order!)
        return patch.execute([...unsetPatches, incPatch, headerInsertPatch, ...cellInsertPatches])
      }
      if (direction === 'right') {
        // * Prepare unset patches
        const headerPathToUnset = `${path}.columnHeaders[${columnIndex}]`
        const cellPathsToUnset = cellsToMove?.map(
          (row) => `${path}.rows[_key=="${row.rowKey}"].cells[${columnIndex}]`,
        )

        const unsetPatches: PatchOperations[] = [
          {
            unset: [...(cellPathsToUnset || []), headerPathToUnset],
          },
        ]

        // * Prepare dec patches for other columns

        const decPatch: PatchOperations = {
          dec: {
            [`${path}.columnHeaders[${columnIndex}].cellIndex`]: 1,
          },
        }

        // * Prepare insert patches
        const headerInsertPatch: PatchOperations = {
          insert: {
            after: `${path}.columnHeaders[${columnIndex}]`,
            items: [headerToPatch!],
          },
        }

        const cellInsertPatches: PatchOperations[] =
          cellsToMove?.map((row) => ({
            insert: {
              after: `${path}.rows[_key=="${row.rowKey}"].cells[${columnIndex}]`,
              items: [row.cell!],
            },
          })) || []

        // * Execute all patches in order
        return patch.execute([...unsetPatches, decPatch, headerInsertPatch, ...cellInsertPatches])
      }
      return console.warn('Something went wrong, please check `handleMoveColumn` implementation')
    },
    [columnIndex, path, value, patch],
  )

  const menuButton = (
    <MenuButton
      button={
        <Button
          id={buttonId}
          icon={iconHorizontal ? EllipsisHorizontalIcon : EllipsisVerticalIcon}
          mode={'bleed'}
          padding={2}
          aria-label={`Column options ${columnIndex + 1}`}
          aria-haspopup="menu"
          aria-controls={menuId}
        />
      }
      id={buttonId}
      menu={
        <Menu id={menuId}>
          {columnIndex === 0 && (
            <>
              <MenuItem
                text="Use as row titles"
                onClick={openPromoteConfirm}
                disabled={readOnly || columnCount <= 1}
                icon={TbLayoutSidebar}
                aria-label="Move this column's content into the row titles and remove the column"
                as={'button'}
              />
              <MenuDivider />
            </>
          )}
          <MenuItem
            text="Add column (left)"
            onClick={() => handleAddColumn('left')}
            disabled={readOnly}
            icon={TbColumnInsertLeft}
            aria-label={`Add column to the left of column ${columnIndex + 1}`}
            as={'button'}
          />
          <MenuItem
            text="Add column (right)"
            onClick={() => handleAddColumn('right')}
            disabled={readOnly}
            icon={TbColumnInsertRight}
            aria-label={`Add column to the right of column ${columnIndex + 1}`}
            as={'button'}
          />
          <MenuDivider />
          <MenuItem
            text="Move column (left)" //"Move column <-"
            onClick={() => handleMoveColumn('left')}
            disabled={readOnly || columnIndex === 0}
            icon={TbArrowBarLeft}
            as={'button'}
            aria-label={`Move column ${columnIndex + 1} to the left`}
          />
          <MenuItem
            text="Move column (right)" // "Move column ->"
            onClick={() => handleMoveColumn('right')}
            disabled={readOnly || columnIndex - columnCount === -1}
            icon={TbArrowBarRight}
            as={'button'}
            aria-label={`Move column ${columnIndex + 1} to the right`}
          />
          <MenuDivider />
          <MenuItem
            text="Remove column"
            onClick={handleDeleteColumn}
            disabled={readOnly}
            icon={TbColumnRemove}
            aria-label={`Remove column ${columnIndex + 1}`}
            as={'button'}
          />
        </Menu>
      }
      popover={{placement: 'right', portal: true}}
    />
  )

  // When rendered directly as a grid header cell (role provided), wrap so the
  // ARIA `columnheader` lands on the cell that contains the menu button rather
  // than on the button itself (which must keep its own button role). The promote
  // confirmation is a sibling so it isn't scoped by the header cell's role.
  return (
    <Fragment>
      {role ? (
        <div role={role} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          {menuButton}
        </div>
      ) : (
        menuButton
      )}
      {columnIndex === 0 && ownsRouteDialog && (
        <ConfirmPromoteHeaderDialog
          mode="columnToRowTitles"
          open={isPromoteConfirmOpen}
          onClose={closePromoteConfirm}
          onConfirm={handlePromoteToRowTitles}
          readOnly={readOnly}
          path={path}
        />
      )}
    </Fragment>
  )
}
export default ColumnContextMenu
