import type {PortableTextBlock} from 'sanity'

import {generateKey} from '../utils/generateKey'

import {cellToText} from './cellToText'
import {createEmptyBlockContent, createTextBlock} from './placeholders'
import type {CellValue, ParsedTable, ToRichTableOptions} from './types'

interface RichTableRow {
  _type: string
  _key: string
  title?: string
  cells: RichTableCell[]
}

interface RichTableCell {
  _type: string
  _key: string
  content: PortableTextBlock[]
}

interface ColumnHeader {
  _type: string
  _key: string
  title?: string
  cellIndex: number
}

/**
 * Shape returned by the converter, matching the `sanity-plugin-rich-table`
 * object schema exactly.
 */
export interface RichTableValue {
  _type: string
  _key: string
  rows: RichTableRow[]
  columnHeaders: ColumnHeader[]
  hasColumnTitles: boolean
  hasRowTitles: boolean
}

/**
 * Converts a {@link ParsedTable} into the `RichTableData` shape expected by
 * `sanity-plugin-rich-table`.
 *
 * Key guarantees:
 * - Every cell has a non-empty `content` array (at minimum one block with an
 *   empty span), as required by the plugin's data structure contract.
 * - Ragged rows are padded to the maximum column count with empty cells.
 * - Column headers are generated from `ParsedTable.headers` when available.
 * - When `hasRowTitles` is true the first column is extracted into each row's
 *   `title` field and excluded from the regular `cells` / `columnHeaders`
 *   arrays, matching the plugin's expected data shape.
 *
 * @see https://github.com/bobinska-dev/sanity-plugin-rich-table/blob/main/docs/data-structure.md
 */
export function toRichTableValue(
  parsed: ParsedTable,
  options?: ToRichTableOptions,
): RichTableValue {
  const hasColumnTitles = options?.hasColumnTitles ?? parsed.headers !== null
  const hasRowTitles = options?.hasRowTitles ?? parsed.hasRowTitles ?? false

  // When hasRowTitles, the first column holds row title text and is not part
  // of the regular data grid. Shift all column indices by 1.
  const dataColStart = hasRowTitles ? 1 : 0

  // Determine max column count across headers and all rows, then subtract
  // the row-title column when applicable.
  const headerLen = parsed.headers?.length ?? 0
  const rawMaxCols = parsed.rows.reduce((max, row) => Math.max(max, row.length), headerLen)
  const maxCols = Math.max(rawMaxCols - dataColStart, 0)

  // Build column headers (skip first when it belongs to the row-title column)
  const columnHeaders: ColumnHeader[] = Array.from({length: maxCols}, (_, i) => ({
    _type: 'columnHeader',
    _key: generateKey(),
    title: parsed.headers?.[i + dataColStart] ?? undefined,
    cellIndex: i,
  }))

  // Build rows, padding ragged rows to maxCols
  const rows: RichTableRow[] = parsed.rows.map((rowCells) => {
    const title = hasRowTitles ? cellToText(rowCells[0]) : undefined

    const cells: RichTableCell[] = Array.from({length: maxCols}, (_, colIdx) => {
      const cellValue: CellValue | undefined = rowCells[colIdx + dataColStart]
      return {
        _type: 'richTableCell',
        _key: generateKey(),
        content: cellValueToContent(cellValue),
      }
    })

    return {
      _type: 'row',
      _key: generateKey(),
      title,
      cells,
    }
  })

  return {
    _type: 'richTable',
    _key: generateKey(),
    rows,
    columnHeaders,
    hasColumnTitles,
    hasRowTitles,
  }
}

/**
 * Converts a single cell value into a valid `content` array.
 * Guarantees the result is never empty — at minimum a block with an empty span.
 */
function cellValueToContent(value: CellValue | undefined): PortableTextBlock[] {
  if (value === undefined || value === null) {
    return createEmptyBlockContent()
  }

  // String cell from TSV/CSV/markdown
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      return createEmptyBlockContent()
    }
    return [createTextBlock(trimmed)]
  }

  // PortableTextBlock[] from HTML parser
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return createEmptyBlockContent()
    }
    return value
  }

  return createEmptyBlockContent()
}

/**
 * The Portable Text block type registered by the plugin — an alias of the
 * `richTable` object type, used when a table lives *inside* a Portable Text
 * field (`defineArrayMember({type: 'richTableBlock'})`).
 */
export const RICH_TABLE_BLOCK_TYPE = 'richTableBlock'

/**
 * Like {@link toRichTableValue}, but stamps `_type: 'richTableBlock'` so the
 * result can be inserted as a Portable Text block (paste-to-import, etc.). The
 * base object type `richTable` is only correct for a standalone object field; a
 * Portable Text member must carry the block type name.
 */
export function toRichTableBlock(
  parsed: ParsedTable,
  options?: ToRichTableOptions,
): RichTableValue {
  return {...toRichTableValue(parsed, options), _type: RICH_TABLE_BLOCK_TYPE}
}
