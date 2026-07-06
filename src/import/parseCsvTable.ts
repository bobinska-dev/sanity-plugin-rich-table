import type {ParseResult} from './types'
import {MAX_IMPORT_ROWS} from './types'

/**
 * Parses a CSV string following RFC 4180 rules into a {@link ParseResult}.
 *
 * Handles:
 * - Quoted fields (fields containing commas, double-quotes, or newlines)
 * - Escaped double-quotes (`""` inside quoted fields)
 * - `\r\n`, `\n`, and lone `\r` (classic-Mac) line endings
 *
 * @see https://www.rfc-editor.org/rfc/rfc4180
 */
export function parseCsvTable(csv: string): ParseResult {
  const warnings: ParseResult['warnings'] = []
  const rows = parseCsvRows(csv)

  if (rows.length === 0) {
    return {table: {headers: null, rows: []}, warnings}
  }

  const hasHeader = rows.length >= 2
  const headers = hasHeader ? rows[0] : null
  const allDataRows = hasHeader ? rows.slice(1) : rows
  const truncated = allDataRows.length > MAX_IMPORT_ROWS
  const dataRows = truncated ? allDataRows.slice(0, MAX_IMPORT_ROWS) : allDataRows

  return {
    table: {headers, rows: dataRows},
    warnings,
    ...(truncated ? {totalRows: allDataRows.length} : {}),
  }
}

/** Low-level RFC 4180 parser that returns an array of string arrays. */
function parseCsvRows(input: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0

  while (i < input.length) {
    const ch = input[i]

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < input.length && input[i + 1] === '"') {
          field += '"'
          i += 2
        } else {
          inQuotes = false
          i++
        }
      } else {
        field += ch
        i++
      }
    } else if (ch === '"') {
      inQuotes = true
      i++
    } else if (ch === ',') {
      row.push(field)
      field = ''
      i++
    } else if (ch === '\r' && i + 1 < input.length && input[i + 1] === '\n') {
      row.push(field)
      field = ''
      rows.push(row)
      row = []
      i += 2
    } else if (ch === '\r') {
      // Lone CR (classic-Mac line ending, or a stray carriage return)
      row.push(field)
      field = ''
      rows.push(row)
      row = []
      i++
    } else if (ch === '\n') {
      row.push(field)
      field = ''
      rows.push(row)
      row = []
      i++
    } else {
      field += ch
      i++
    }
  }

  // Flush last field/row
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}
