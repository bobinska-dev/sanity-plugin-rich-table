import {EllipsisVerticalIcon} from '@sanity/icons'
import {PatchOperations} from '@sanity/types'
import {Button, Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui'
import {ComponentType, Fragment, useCallback} from 'react'
import {
  TbArrowBarDown,
  TbArrowBarUp,
  TbLayoutNavbar,
  TbRowInsertBottom,
  TbRowInsertTop,
  TbRowRemove,
} from 'react-icons/tb'
import {OperationsAPI} from 'sanity'

import {
  PROMOTE_PARAM,
  promoteDialogParamValue,
  useRouteDialogState,
} from '../hooks/useDialogRouteState'
import {RichTableType} from '../schemas/richTable.object'
import {RichTableRowType} from '../schemas/row.object'
import {createEmptyCell} from '../utils/createEmptyCell'
import {generateKey} from '../utils/generateKey'
import {portableTextToPlain} from '../utils/portableTextToPlain'
import ConfirmPromoteHeaderDialog from './ConfirmPromoteHeaderDialog'

interface RowContextMenuProps {
  rowIndex: number
  rowCount: number
  row: RichTableRowType
  /** Patch function from Sanity document operations for optimistic changes */
  patch: OperationsAPI['patch']
  path: string
  readOnly: boolean | undefined
  role?: string
  /** Namespaces the menu/button ids per table instance so the inline table and
   * the expanded-table dialog don't emit duplicate DOM ids when both are mounted. */
  tableId?: string
  /** Full table value — needed to read the column headers when promoting a row. */
  value: RichTableType
  /**
   * Whether this menu's surface should render the (URL-param-driven) promote
   * confirmation. The inline table and the expanded dialog are mounted at once
   * and share the param, so only the active surface renders the dialog to avoid
   * two stacked modals. Defaults to `true`. {@link ../hooks/useDialogRouteState}
   */
  ownsRouteDialog?: boolean
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
  role,
  tableId,
  value,
  ownsRouteDialog = true,
}) => {
  const menuId = `${tableId ? `${tableId}-` : ''}row-menu-${rowIndex}`
  // Register the confirmation in the pane's URL params so it's deep-linkable,
  // refresh-persistent, and closable with the browser back button. Keyed by the
  // table path, so gate the dialog render to the first row (below) to avoid every
  // row's menu opening its own copy.
  const {
    open: isPromoteConfirmOpen,
    handleOpen: openPromoteConfirm,
    handleClose: closePromoteConfirm,
  } = useRouteDialogState(PROMOTE_PARAM, promoteDialogParamValue('rowToColumnTitles', path))
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
  // * Promote this row to be the column titles, then remove it.
  // Each cell's rich content is flattened to plain text (marks/formatting are
  // dropped) and written to the matching column header's `title`.
  const handlePromoteToColumnTitles = useCallback(() => {
    const headers = value.columnHeaders ?? []
    const titlePatches: PatchOperations[] = headers.map((header, columnIndex) => ({
      set: {
        [`${path}.columnHeaders[_key=="${header._key}"].title`]: portableTextToPlain(
          row.cells?.[columnIndex]?.content,
        ),
      },
    }))
    const showColumnTitlesPatch: PatchOperations = {
      set: {[`${path}.hasColumnTitles`]: true},
    }
    const removeRowPatch: PatchOperations = {
      unset: [`${path}.rows[${rowIndex}]`],
    }
    return patch.execute([...titlePatches, showColumnTitlesPatch, removeRowPatch])
  }, [value.columnHeaders, row.cells, path, rowIndex, patch])

  const menuButton = (
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
          {rowIndex === 0 && (
            <>
              <MenuItem
                text="Use as column titles"
                onClick={openPromoteConfirm}
                disabled={readOnly || rowCount <= 1}
                icon={TbLayoutNavbar}
                aria-label="Move this row's content into the column titles and remove the row"
              />
              <MenuDivider />
            </>
          )}
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

  // When rendered directly as a grid header cell (role provided), wrap so the
  // ARIA `rowheader` lands on the cell that contains the menu button rather than
  // on the button itself (which must keep its own button role). The promote
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
      {rowIndex === 0 && ownsRouteDialog && (
        <ConfirmPromoteHeaderDialog
          mode="rowToColumnTitles"
          open={isPromoteConfirmOpen}
          onClose={closePromoteConfirm}
          onConfirm={handlePromoteToColumnTitles}
          readOnly={readOnly}
          path={path}
        />
      )}
    </Fragment>
  )
}
export default RowContextMenu
