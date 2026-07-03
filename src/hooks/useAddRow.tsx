import {useCallback} from 'react'
import {OperationsAPI} from 'sanity'

import {RichTableCellType} from '../schemas/cell.object'
import {RichTableType} from '../schemas/richTable.object'
import {RichTableRowType} from '../schemas/row.object'
import {createEmptyCell} from '../utils/createEmptyCell'
import {generateKey} from '../utils/generateKey'

interface UseAddRowProps {
  /** Patch function from Sanity document operations for optimistic changes */
  patch: OperationsAPI['patch']
  /** Path to the rich table in the document. */
  path: string
  /** Current value of the rich table object */
  value: RichTableType
}

export default function useAddRow({path, value, patch}: UseAddRowProps) {
  return useCallback(() => {
    const colCount = value?.columnHeaders?.length || 0
    // Create an array of empty cells for the new row.
    const cells: RichTableCellType[] = Array.from({length: colCount ?? 1}, () => createEmptyCell())

    // const newRowTitle = `${value?.rows ? value.rows.length + 1 : 1}`
    // Define the new row with the generated cells.
    const newRow: RichTableRowType = {
      _type: 'row',
      _key: generateKey(),
      cells: cells,
    }
    // Use the patch function to optimistically add the new row.
    patch.execute([
      {
        insert: {
          after: `${path}.rows[-1]`,
          items: [newRow],
        },
      },
    ])
  }, [path, patch, value])
}
