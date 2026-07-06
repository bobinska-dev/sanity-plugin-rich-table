import type {ParseResult} from './types'
import {MAX_IMPORT_ROWS} from './types'

/**
 * Parses a tab-separated-values string (the `text/plain` clipboard format from
 * Google Sheets, Excel, and most spreadsheet apps) into a {@link ParseResult}.
 *
 * The first row is treated as the header row when the table has at least two
 * rows, since spreadsheet copies typically include the header.
 */
export function parseTsvTable(tsv: string): ParseResult {
  const warnings: ParseResult['warnings'] = []

  const lines = tsv.split(/\r\n|\n/).filter((line) => line.length > 0)

  if (lines.length === 0) {
    return {table: {headers: null, rows: []}, warnings}
  }

  const allRows = lines.map((line) => line.split('\t'))

  const hasHeader = allRows.length >= 2
  const headers = hasHeader ? allRows[0] : null
  const allDataRows = hasHeader ? allRows.slice(1) : allRows
  const truncated = allDataRows.length > MAX_IMPORT_ROWS
  const dataRows = truncated ? allDataRows.slice(0, MAX_IMPORT_ROWS) : allDataRows

  return {
    table: {headers, rows: dataRows},
    warnings,
    ...(truncated ? {totalRows: allDataRows.length} : {}),
  }
}
