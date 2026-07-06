import {EllipsisHorizontalIcon, EllipsisVerticalIcon} from '@sanity/icons'
import {PatchOperations} from '@sanity/types'
import {Button, Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui'
import {ComponentType, useCallback} from 'react'
import {
  TbArrowBarLeft,
  TbArrowBarRight,
  TbColumnInsertLeft,
  TbColumnInsertRight,
  TbColumnRemove,
} from 'react-icons/tb'
import {ObjectItem, OperationsAPI} from 'sanity'

import {RichTableCellType} from '../schemas/cell.object'
import {ColumnHeader} from '../schemas/columnHeader.object'
import {RichTableType} from '../schemas/richTable.object'
import {createEmptyCell} from '../utils/createEmptyCell'
import {generateKey} from '../utils/generateKey'

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
    // tableId is available for future use
  } = props
  const columnHeaderPathString = `${path}.columnHeaders[_key=="${columnHeaderKey}"]`
  const menuId = `column-menu-${columnHeaderKey}`
  const buttonId = `${menuId}-button`

  const handleDeleteColumn = useCallback(() => {
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

    return patch.execute([headerUnsetPatch, cellUnsetPatch, ...cellIndexPatches])
  }, [rowCount, columnIndex, columnCount, path, columnHeaderPathString, patch])

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
  // than on the button itself (which must keep its own button role).
  return role ? (
    <div role={role} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      {menuButton}
    </div>
  ) : (
    menuButton
  )
}
export default ColumnContextMenu
