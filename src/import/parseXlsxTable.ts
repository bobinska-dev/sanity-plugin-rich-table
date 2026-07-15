import * as XLSX from '@e965/xlsx'
import type {PortableTextBlock} from 'sanity'

import {parseHtmlTable} from './parseHtmlTable'
import {createPlaceholderBlock} from './placeholders'
import type {ParseWarning, XlsxParseResult} from './types'

/**
 * Parses an Excel workbook (`ArrayBuffer`) into a {@link XlsxParseResult}.
 *
 * By default the first sheet is used. Pass `sheetName` to select a different
 * sheet. The result includes `sheetNames` so callers can offer a sheet picker.
 *
 * Internally converts the sheet to HTML via SheetJS `sheet_to_html` and then
 * delegates to {@link parseHtmlTable}, which preserves formatting (bold,
 * italic, links), generates placeholders for images, and applies header
 * heuristics -- reusing all existing HTML parsing logic.
 *
 * After HTML parsing, scans for embedded objects that SheetJS silently drops:
 * stub cells (`t === "z"`) get placeholder blocks, and for files where stubs
 * are absent checks BIFF `!objects` and OOXML `xl/drawings/` zip entries to
 * warn the user about lost images/charts.
 *
 * Uses [SheetJS](https://sheetjs.com/) for client-side parsing -- no server
 * round-trip required.
 */
export function parseXlsxTable(buffer: ArrayBuffer, sheetName?: string): XlsxParseResult {
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellStyles: true,
    bookFiles: true,
  })
  const sheetNames = workbook.SheetNames

  if (sheetNames.length === 0) {
    return {table: {headers: null, rows: []}, warnings: [], sheetNames: []}
  }

  const targetSheet = sheetName ?? sheetNames[0]
  const worksheet = workbook.Sheets[targetSheet]

  if (!worksheet || !worksheet['!ref']) {
    return {table: {headers: null, rows: []}, warnings: [], sheetNames}
  }

  trimTrailingEmptyColumns(worksheet)

  const html = XLSX.utils.sheet_to_html(worksheet)
  const htmlResult = parseHtmlTable(html)

  const stubCount = injectStubPlaceholders(worksheet, htmlResult)

  if (stubCount === 0) {
    addEmbeddedObjectWarning(workbook, worksheet, htmlResult)
  }

  return {...htmlResult, sheetNames}
}

/**
 * Scans the raw worksheet for stub cells (`cell.t === "z"`) and injects a
 * visible placeholder block into the corresponding position in the parsed
 * table. SheetJS CE creates stub cells for worksheet positions that are
 * referenced by embedded objects (images, charts, OLE) but contain no text.
 *
 * @returns The number of stub cells that were replaced with placeholders.
 */
function injectStubPlaceholders(
  ws: XLSX.WorkSheet,
  result: {
    table: {headers: string[] | null; rows: (string | PortableTextBlock[])[][]}
    warnings: ParseWarning[]
  },
): number {
  const ref = ws['!ref']
  if (!ref) return 0

  const range = XLSX.utils.decode_range(ref)
  const headerOffset = result.table.headers ? 1 : 0
  let count = 0

  for (let r = range.s.r + headerOffset; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({r, c})
      const cell = ws[addr]
      if (cell && cell.t === 'z') {
        const rowIdx = r - range.s.r - headerOffset
        const colIdx = c - range.s.c
        if (result.table.rows[rowIdx] && colIdx < (result.table.rows[rowIdx]?.length ?? 0)) {
          result.table.rows[rowIdx][colIdx] = [createPlaceholderBlock('image')]
          result.warnings.push({row: rowIdx, col: colIdx, reason: 'image'})
          count++
        }
      }
    }
  }

  return count
}

/**
 * Detects embedded objects that SheetJS CE silently drops during parsing and
 * adds a user-facing warning when found.
 *
 * Two detection paths:
 *
 * 1. **BIFF (`.xls`)**: The parser stores legacy drawing objects in
 *    `ws["!objects"]` but discards the anchor records that map them to cells.
 *    We detect the presence of `!objects` to know images/charts exist.
 *
 * 2. **OOXML (`.xlsx`)**: The parser ignores `<drawing>` elements entirely.
 *    With `bookFiles: true`, the workbook exposes zip entry paths in `.keys`
 *    -- we check for `xl/drawings/` entries.
 *
 * In both cases we add a sheet-level warning guiding the user to copy-paste
 * from their spreadsheet app instead, which preserves images in clipboard HTML.
 */
function addEmbeddedObjectWarning(
  workbook: XLSX.WorkBook,
  ws: XLSX.WorkSheet,
  result: {warnings: ParseWarning[]},
): void {
  const objects = (ws as unknown as Record<string, unknown>)['!objects']
  const hasBiffObjects = objects && typeof objects === 'object' && Object.keys(objects).length > 0

  const keys = (workbook as unknown as Record<string, unknown>).keys as string[] | undefined
  const hasOoxmlDrawings = keys?.some((key) => key.startsWith('xl/drawings/')) ?? false

  if (hasBiffObjects || hasOoxmlDrawings) {
    result.warnings.push({
      row: 0,
      col: 0,
      reason:
        'image — This file contains embedded images or charts that cannot be imported from file uploads. Copy-paste from your spreadsheet app to preserve image placeholders.',
    })
  }
}

/**
 * Shrinks the worksheet `!ref` range to exclude trailing columns that contain
 * no data. Spreadsheets often have a `!ref` extending far beyond the actual
 * table (e.g. formatting or conditional-format ranges), which causes
 * `sheet_to_html` to emit many empty `<td>` elements.
 *
 * Mutates the worksheet in place for efficiency — the caller does not need
 * the original range afterwards.
 */
function trimTrailingEmptyColumns(ws: XLSX.WorkSheet): void {
  const ref = ws['!ref']
  if (!ref) return

  const range = XLSX.utils.decode_range(ref)
  let lastNonEmptyCol = range.s.c

  for (let col = range.s.c; col <= range.e.c; col++) {
    for (let row = range.s.r; row <= range.e.r; row++) {
      const addr = XLSX.utils.encode_cell({r: row, c: col})
      const cell = ws[addr]
      if (cell && cell.v !== undefined && cell.v !== null && String(cell.v).trim() !== '') {
        lastNonEmptyCol = col
        break
      }
    }
  }

  if (lastNonEmptyCol < range.e.c) {
    range.e.c = lastNonEmptyCol
    ws['!ref'] = XLSX.utils.encode_range(range)
  }
}
