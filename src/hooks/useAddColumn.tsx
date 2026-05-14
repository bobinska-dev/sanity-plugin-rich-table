import {PatchOperations} from '@sanity/types'
import {useCallback} from 'react'
import {OperationsAPI, PortableTextBlock} from 'sanity'

import {RichTableCellType} from '../schemas/cell.object'
import {ColumnHeader} from '../schemas/columnHeader.object'
import {RichTableType} from '../schemas/richTable.object'
import {generateKey} from '../utils/generateKey'

interface UseAddColumnParams {
  /** Patch function from Sanity document operations for optimistic changes */
  patch: OperationsAPI['patch']
  /** Path to the rich table inside the document. */
  path: string
  /** Current value of the rich table object */
  value: RichTableType
}

export function useAddColumn({path, value, patch}: UseAddColumnParams) {
  return useCallback(() => {
    const colCount = value?.columnHeaders?.length || 0

    // Template for a new empty cell
    const newCellItem: RichTableCellType = {
      _type: 'richTableCell',
      _key: generateKey(),
      content: [
        {
          _type: 'block',
          _key: generateKey(),
          markDefs: [],
          children: [{_type: 'span', text: '', marks: []}],
        },
      ] as unknown as PortableTextBlock[],
    }

    // Letter in the alphabet based on column count (A, B, C, ...)
    // const newColumnTitle = getLetterBasedOnIndex(colCount)

    // New column header item (title uses current header count when available)
    const newColumnHeaderItem: ColumnHeader & {_key: string; _type: string} = {
      _type: 'columnHeader',
      _key: generateKey(),
      // title: newColumnTitle,
      cellIndex: colCount,
    }

    // Patches based on `patch` function
    const rowPatchEvents: PatchOperations[] =
      value.rows?.map((_, rowIndex) => {
        const rowCellPath = `${path}.rows[${rowIndex}].cells[-1]`
        return {
          insert: {
            after: rowCellPath,
            items: [newCellItem],
          },
        } as PatchOperations
      }) ?? []
    const headerPatchEvent: PatchOperations = {
      insert: {
        after: `${path}.columnHeaders[-1]`,
        items: [newColumnHeaderItem],
      },
    }
    patch.execute([...rowPatchEvents, headerPatchEvent])
  }, [path, value, patch])
}
