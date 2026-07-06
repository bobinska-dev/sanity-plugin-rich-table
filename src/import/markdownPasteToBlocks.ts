import {keyGenerator} from '@portabletext/editor'
import {markdownToPortableText} from '@portabletext/markdown'
import type {PortableTextBlock} from 'sanity'

import {cellToText} from './cellToText'
import {toRichTableBlock} from './toRichTableValue'
import type {CellValue, ParsedTable} from './types'

/**
 * Cell shape produced by `@portabletext/markdown` for a `_type: 'table'` block.
 * Each cell's `value` is an array of Portable Text blocks (already rich, with
 * decorators and links applied).
 */
interface MdTableCell {
  _type: 'cell'
  _key?: string
  value: PortableTextBlock[]
}

interface MdTableRow {
  _type: 'row'
  _key?: string
  cells: MdTableCell[]
}

interface MdTableBlock {
  _type: 'table'
  _key?: string
  headerRows?: number
  rows: MdTableRow[]
}

/**
 * Span shape inside a Portable Text block. Locally redeclared because
 * `PortableTextSpan` from sanity narrows `marks` in ways that don't allow the
 * runtime checks below.
 */
interface PtSpan {
  _type: 'span'
  text?: string
  marks?: string[]
}

/**
 * Converts a clipboard markdown payload into an ordered array of Portable Text
 * blocks suitable for `insert.blocks`, with embedded markdown tables emitted
 * directly as `richTable` blocks.
 *
 * Why pass `types.table`?
 *
 * `markdownToPortableText`'s default options *do not* include a `types.table`
 * matcher. When a markdown table is parsed without a matcher, the library
 * silently calls its internal `flattenTable` helper which dumps each cell's
 * text as separate plain blocks — i.e. the table disappears. By providing a
 * matcher we both prevent that flattening and short-circuit straight to our
 * `richTable` shape, so prose, headings, and lists from the same paste flow
 * through unchanged while tables become rich tables in one pass.
 */
export function markdownPasteToBlocks(plain: string): PortableTextBlock[] {
  if (!plain) return []

  const blocks = markdownToPortableText(plain, {
    keyGenerator,
    types: {
      table: ({value}) => {
        // `@portabletext/markdown`'s matcher `value` omits the wrapper's
        // `_type` and carries extra fields (e.g. `alignment`), so it no longer
        // structurally overlaps our documented subset — cast through `unknown`.
        const parsed = mdTableBlockToParsedTable(value as unknown as MdTableBlock)
        if (parsed.rows.length === 0 && parsed.headers === null) return undefined
        // toRichTableBlock returns the rich-table block shape (`richTableBlock`),
        // which is structurally a `PortableTextObject`. The matcher's typing
        // requires a `PortableTextObject`-compatible return; cast through unknown.
        return toRichTableBlock(parsed) as unknown as ReturnType<
          NonNullable<
            NonNullable<NonNullable<Parameters<typeof markdownToPortableText>[1]>['types']>['table']
          >
        >
      },
    },
  }) as PortableTextBlock[]

  return Array.isArray(blocks) ? blocks : []
}

/**
 * Maps a `@portabletext/markdown` `_type: 'table'` block onto our internal
 * {@link ParsedTable} shape so it can be funnelled through `toRichTableValue`.
 *
 * Detects row titles by checking whether every non-empty first-column cell is
 * entirely bold — a more reliable signal than the raw-string `**…**` heuristic
 * used in `parseMarkdownTable`, because by this stage the bold markers have
 * been collapsed into span `marks` arrays.
 */
function mdTableBlockToParsedTable(block: MdTableBlock): ParsedTable {
  const headerRows = block.headerRows ?? 0
  const allRows = block.rows ?? []

  const headerSourceRows = allRows.slice(0, headerRows)
  const dataRows = allRows.slice(headerRows)

  const headers = buildHeaderTexts(headerSourceRows)

  const rows: CellValue[][] = dataRows.map((row) =>
    (row.cells ?? []).map((cell) => cell.value ?? []),
  )

  const hasRowTitles = detectFirstColumnAllBold(dataRows)

  return {headers, rows, hasRowTitles}
}

/**
 * Builds a flat list of header strings from one or more header rows. Multiple
 * header rows are concatenated cell-wise with a space separator so that
 * stacked-header tables degrade cleanly into a single header row.
 */
function buildHeaderTexts(headerRows: MdTableRow[]): string[] | null {
  if (headerRows.length === 0) return null

  const colCount = headerRows.reduce((max, row) => Math.max(max, row.cells?.length ?? 0), 0)
  if (colCount === 0) return null

  const headers: string[] = []
  for (let col = 0; col < colCount; col++) {
    const parts: string[] = []
    for (const row of headerRows) {
      const cell = row.cells?.[col]
      if (!cell) continue
      const text = cellToText(cell.value).trim()
      if (text) parts.push(text)
    }
    headers.push(parts.join(' '))
  }
  return headers
}

function detectFirstColumnAllBold(rows: MdTableRow[]): boolean {
  if (rows.length === 0) return false

  let sawText = false
  for (const row of rows) {
    const firstCell = row.cells?.[0]
    if (!firstCell) return false
    const blocks = firstCell.value ?? []
    const result = checkCellBold(blocks)
    if (result === 'empty') continue
    if (result === 'mixed') return false
    sawText = true
  }
  return sawText
}

/**
 * Returns whether a cell's text content is entirely wrapped in `strong` marks.
 *
 * - `'empty'`  : cell has no non-whitespace text — neutral, doesn't contribute.
 * - `'allBold'`: every non-empty span has the `strong` decorator applied.
 * - `'mixed'`  : at least one non-empty span lacks `strong`.
 */
function checkCellBold(blocks: PortableTextBlock[]): 'empty' | 'allBold' | 'mixed' {
  let sawText = false
  for (const block of blocks) {
    if ((block as {_type?: string})._type !== 'block') continue
    const children = ((block as unknown as {children?: unknown[]}).children ?? []) as PtSpan[]
    for (const child of children) {
      if (child?._type !== 'span') continue
      const text = (child.text ?? '').trim()
      if (!text) continue
      sawText = true
      const marks = Array.isArray(child.marks) ? child.marks : []
      if (!marks.includes('strong')) return 'mixed'
    }
  }
  return sawText ? 'allBold' : 'empty'
}
