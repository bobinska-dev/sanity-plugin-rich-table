import type {RichTableCellType} from '../schemas/cell.object'
import type {RichTableType} from '../schemas/richTable.object'
import {portableTextToPlain} from './portableTextToPlain'

export interface ToMarkdownTableOptions {
  /**
   * Turn a single cell's Portable Text `content` into a Markdown-safe string.
   * Defaults to the cell's plain text (marks, annotations and block objects are
   * flattened — the same lossy view used by the diff). Provide your own to emit
   * inline Markdown (e.g. `**bold**`, `[text](href)`) for your custom schema.
   *
   * Whatever you return is written verbatim into the cell, so escape `|` and
   * newlines yourself if your output can contain them (the default does).
   */
  cellToMarkdown?: (cell: RichTableCellType) => string
}

type ColumnHeaders = NonNullable<RichTableType['columnHeaders']>
type Row = NonNullable<RichTableType['rows']>[number]

/** Escape a plain string for use inside a GitHub-flavored Markdown table cell. */
function escapeCell(value: string): string {
  return value
    .replace(/\\/g, '\\\\') // literal backslashes first, so we don't double-escape below
    .replace(/\|/g, '\\|') // pipes would otherwise start a new column
    .replace(/\r\n|\r|\n/g, '<br>') // GFM cells can't span lines; <br> is the convention
}

const defaultCellToMarkdown = (cell: RichTableCellType): string =>
  escapeCell(portableTextToPlain(cell?.content))

const toMarkdownRow = (cells: string[]): string => `| ${cells.join(' | ')} |`

/** The data-column header cells (excluding the row-title corner), left→right. */
function resolveColumnTitles(
  columnHeaders: ColumnHeaders,
  columnCount: number,
  withColumnTitles: boolean,
): string[] {
  if (!withColumnTitles) return Array.from({length: columnCount}, () => '')

  // Column titles are keyed by `cellIndex`, which need not match array order.
  const byIndex = new Map<number, string>()
  for (const header of columnHeaders) {
    if (typeof header?.cellIndex === 'number') {
      byIndex.set(header.cellIndex, escapeCell(header.title ?? ''))
    }
  }
  return Array.from({length: columnCount}, (_unused, col) => byIndex.get(col) ?? '')
}

/** One body row's cells: optional bold row title, then every data column. */
function resolveRowCells(
  row: Row,
  columnCount: number,
  withRowTitles: boolean,
  cellToMarkdown: (cell: RichTableCellType) => string,
): string[] {
  const cells: string[] = []
  if (withRowTitles) cells.push(row?.title ? `**${escapeCell(row.title)}**` : '')
  for (let col = 0; col < columnCount; col++) {
    const cell = row?.cells?.[col]
    cells.push(cell ? cellToMarkdown(cell) : '')
  }
  return cells
}

/**
 * Serialize a {@link RichTableType} value into a GitHub-flavored Markdown table
 * string — the inverse of the plugin's `parseMarkdownTable` importer.
 *
 * - Column titles (when `hasColumnTitles`) become the header row; without them a
 *   valid-but-empty header row is emitted so the output is still a proper GFM
 *   table.
 * - Row titles (when `hasRowTitles`) become a leading column, each wrapped in
 *   `**bold**` so a round-trip back through `parseMarkdownTable` re-detects them.
 * - Cell content is flattened to plain text by default; pass
 *   {@link ToMarkdownTableOptions.cellToMarkdown} to control the per-cell output.
 *
 * Pure and side-effect free — safe to call in Studio, a build step or a server.
 * Returns an empty string for a table with no columns.
 */
export function toMarkdownTable(
  table: RichTableType,
  options: ToMarkdownTableOptions = {},
): string {
  const cellToMarkdown = options.cellToMarkdown ?? defaultCellToMarkdown
  const rows = table?.rows ?? []
  const columnHeaders = table?.columnHeaders ?? []

  const withColumnTitles = Boolean(table?.hasColumnTitles) && columnHeaders.length > 0
  const withRowTitles = Boolean(table?.hasRowTitles)

  // The widest row wins, so ragged rows still line up under the same columns.
  const columnCount = Math.max(
    columnHeaders.length,
    0,
    ...rows.map((row) => row?.cells?.length ?? 0),
  )

  if (columnCount + (withRowTitles ? 1 : 0) === 0) return ''

  const headerTitles = resolveColumnTitles(columnHeaders, columnCount, withColumnTitles)
  const headerCells = withRowTitles ? ['', ...headerTitles] : headerTitles

  const lines = [toMarkdownRow(headerCells), toMarkdownRow(headerCells.map(() => '---'))]
  for (const row of rows) {
    lines.push(toMarkdownRow(resolveRowCells(row, columnCount, withRowTitles, cellToMarkdown)))
  }

  return lines.join('\n')
}
