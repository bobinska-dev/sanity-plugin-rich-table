import {parseCsvTable} from './parseCsvTable'
import type {ParseResult, XlsxParseResult} from './types'

/** File extensions accepted by the upload input. */
export const ACCEPTED_FILE_EXTENSIONS = '.csv,.tsv,.xls,.xlsx'

/**
 * Parses a `File` object into a {@link ParseResult} based on its extension.
 *
 * Routes to the appropriate parser:
 * - `.csv` → {@link parseCsvTable}
 * - `.tsv` → lazy-imported `parseTsvTable`
 * - `.xls` / `.xlsx` → lazy-imported `parseXlsxTable`
 *
 * XLSX and TSV parsers are dynamically imported so the heavy SheetJS bundle
 * is only downloaded when the user actually uploads a matching file type.
 *
 * Returns `null` for unsupported extensions.
 */
export async function parseFile(
  file: File,
  xlsxSheetName?: string,
): Promise<ParseResult | XlsxParseResult | null> {
  const ext = file.name.split('.').pop()?.toLowerCase()

  switch (ext) {
    case 'csv': {
      const text = await file.text()
      return parseCsvTable(text)
    }

    case 'tsv': {
      const text = await file.text()
      const {parseTsvTable} = await import('./parseTsvTable')
      return parseTsvTable(text)
    }

    case 'xls':
    case 'xlsx': {
      const buffer = await file.arrayBuffer()
      const {parseXlsxTable} = await import('./parseXlsxTable')
      return parseXlsxTable(buffer, xlsxSheetName)
    }

    default:
      return null
  }
}
