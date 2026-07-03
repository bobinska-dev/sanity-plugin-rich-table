import {EllipsisVerticalIcon} from '@sanity/icons'
import {PatchOperations} from '@sanity/types'
import {Button, Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui'
import {ComponentType, useCallback} from 'react'
import {
  TbArrowBarDown,
  TbArrowBarUp,
  TbRowInsertBottom,
  TbRowInsertTop,
  TbRowRemove,
} from 'react-icons/tb'
import {OperationsAPI} from 'sanity'

import {RichTableRowType} from '../schemas/row.object'
import {createEmptyCell} from '../utils/createEmptyCell'
import {generateKey} from '../utils/generateKey'

interface RowContextMenuProps {
  rowIndex: number
  rowCount: number
  row: RichTableRowType
  /** Patch function from Sanity document operations for optimistic changes */
  patch: OperationsAPI['patch']
  path: string
  readOnly: boolean | undefined
  role?: string
}

/** # Menu button for each row in the table
 *
 * Menu items for adding, moving, and deleting rows.
 *
 * @param rowIndex - Index of the row
 * @param row - {@link RichTableRowType} The row object
 * @param patch - {@link OperationsAPI} patch function from Sanity document operations for optimistic changes
 * @param path - {@link Path} to the row in the Sanity document
 * @param rowCount - Total number of rows in the table
 * @param readOnly - Whether the table is in read-only mode
 */
const RowContextMenu: ComponentType<RowContextMenuProps> = ({
  row,
  rowIndex,
  patch,
  path,
  rowCount,
  readOnly,
}) => {
  const menuId = `row-menu-${rowIndex}`
  // * Handle delete row
  const handleDeleteRow = useCallback(() => {
    const rowUnsetPatch = {
      unset: [`${path}.rows[${rowIndex}]`],
    }
    return patch.execute([rowUnsetPatch])
  }, [patch, path, rowIndex])

  // * Handle add row
  const handleAddRow = useCallback(
    (side: 'above' | 'below') => {
      const currentRowPathString = `${path}.rows[${rowIndex}]`
      const newCells: RichTableRowType['cells'] = row.cells?.map(() => createEmptyCell())

      const newRow: RichTableRowType = {
        _type: 'row',
        _key: generateKey(),
        cells: newCells,
      }
      const addRowPatch: PatchOperations =
        side === 'below'
          ? {
              insert: {
                after: currentRowPathString,
                items: [newRow],
              },
            }
          : {
              insert: {
                before: currentRowPathString,
                items: [newRow],
              },
            }

      return patch.execute([addRowPatch])
    },
    [patch, path, row.cells, rowIndex],
  )

  // * Handle row move
  const handleMoveRow = useCallback(
    (direction: 'up' | 'down') => {
      const rowToMove = row
      const unsetPatch: PatchOperations = {
        unset: [`${path}.rows[${rowIndex}]`],
      }
      if (direction === 'up') {
        const insertPatch: PatchOperations = {
          insert: {
            before: `${path}.rows[${rowIndex - 1}]`,
            items: [rowToMove],
          },
        }
        return patch.execute([unsetPatch, insertPatch])
      }
      if (direction === 'down') {
        const insertPatch: PatchOperations = {
          insert: {
            after: `${path}.rows[${rowIndex}]`,
            items: [rowToMove],
          },
        }
        return patch.execute([unsetPatch, insertPatch])
      }
      return console.warn(
        'Something went wrong while moving the row. Please check RowContextMenu.tsx and the handleMoveRow function.',
      )
    },
    [patch, path, row, rowIndex],
  )
  return (
    <MenuButton
      button={
        <Button
          icon={EllipsisVerticalIcon}
          mode={'bleed'}
          padding={2}
          aria-label={`Row options ${rowIndex + 1}`}
          aria-haspopup="menu"
          aria-controls={menuId}
        />
      }
      id={`${menuId}-button`}
      menu={
        <Menu id={menuId}>
          <MenuItem
            text="Add row (above)"
            onClick={() => handleAddRow('above')}
            disabled={readOnly}
            icon={TbRowInsertTop}
          />
          <MenuItem
            text="Add row (below)"
            onClick={() => handleAddRow('below')}
            disabled={readOnly}
            icon={TbRowInsertBottom}
          />
          <MenuDivider />
          <MenuItem
            text="Move row (up)"
            onClick={() => handleMoveRow('up')}
            disabled={readOnly || rowIndex === 0}
            icon={TbArrowBarUp}
          />
          <MenuItem
            text="Move row (down)"
            onClick={() => handleMoveRow('down')}
            disabled={readOnly || rowIndex - rowCount === -1}
            icon={TbArrowBarDown}
          />
          <MenuDivider />
          <MenuItem
            text="Remove row"
            onClick={handleDeleteRow}
            disabled={readOnly}
            icon={TbRowRemove}
          />
        </Menu>
      }
      popover={{placement: 'right', portal: true}}
    />
  )
}
export default RowContextMenu
