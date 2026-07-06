import type {PortableTextBlock} from 'sanity'

/** A single cell can be plain text (from TSV/CSV/markdown) or rich PT blocks (from HTML). */
export type CellValue = string | PortableTextBlock[]

/**
 * Intermediate table representation shared by all parsers.
 *
 * Parsers produce this shape; {@link toRichTableValue} converts it into the
 * `RichTableData` structure expected by `sanity-plugin-rich-table`.
 */
export interface ParsedTable {
  /** Column header labels extracted from the first row, or `null` when no header row was detected. */
  headers: string[] | null
  /** Data rows (excluding the header row when headers are present). */
  rows: CellValue[][]
  /** `true` when the first column was detected as bold row titles (e.g. Google Sheets formatted tables). */
  hasRowTitles?: boolean
}

/** Describes a single cell that could not be fully parsed. */
export interface ParseWarning {
  /** Zero-based row index in the parsed table (relative to data rows, not the header). */
  row: number
  /** Zero-based column index. */
  col: number
  /** Human-readable reason shown in the placeholder cell text. */
  reason: string
}

/**
 * Result returned by every parser. Carries both the parsed table data and any
 * warnings about cells that could not be fully converted.
 */
export interface ParseResult {
  table: ParsedTable
  warnings: ParseWarning[]
  /**
   * Total number of data rows in the source table before truncation to
   * {@link MAX_IMPORT_ROWS}. Only set when rows were actually truncated,
   * so callers can show a notice about the dropped rows.
   */
  totalRows?: number
}

/** Options passed to {@link toRichTableValue} to control header behaviour. */
export interface ToRichTableOptions {
  /** Treat the first row of the parsed table as column headers. Defaults to `true` when headers are present. */
  hasColumnTitles?: boolean
  /** Treat the first column as row titles. Defaults to `false`. */
  hasRowTitles?: boolean
}

/** Supported table formats for detection and explicit selection. */
export type TableFormat = 'html' | 'markdown' | 'tsv' | 'csv' | 'xlsx'

/**
 * Extended parse result for Excel files, which may contain multiple sheets.
 * The dialog uses `sheetNames` to render a sheet selector dropdown.
 */
export interface XlsxParseResult extends ParseResult {
  /** Names of all sheets in the workbook (first sheet is used by default). */
  sheetNames: string[]
}

/** Maximum number of rows imported in a single paste to avoid Studio performance degradation. */
export const MAX_IMPORT_ROWS = 300
