import type {ParseResult} from './types'
import {MAX_IMPORT_ROWS} from './types'

interface ToastPayload {
  title: string
  description: string
  status: 'success' | 'warning' | 'error'
  closable: boolean
}

/**
 * Derives the appropriate toast notification from a {@link ParseResult} and
 * contextual metadata about the import.
 *
 * @param result - The parse result (may be `null` if format detection failed).
 * @param totalRowCount - Total rows before truncation, if the source exceeded
 *   {@link MAX_IMPORT_ROWS}.
 * @param isRichFormat - `true` when the source was HTML (preserves formatting).
 */
export function getToastForResult(
  result: ParseResult | null,
  totalRowCount?: number,
  isRichFormat = false,
): ToastPayload {
  // Format not detected at all
  if (!result) {
    return {
      title: 'Could not detect table data',
      description:
        'The pasted content does not appear to contain a table. Try copying cells directly from your spreadsheet, or use the Import dialog to select a format manually.',
      status: 'error',
      closable: true,
    }
  }

  const {table, warnings} = result

  // Parse produced no rows
  if (table.rows.length === 0) {
    return {
      title: 'Table import failed',
      description:
        'The table data could not be parsed. It may be in an unsupported format. Try pasting as plain text or importing a CSV file instead.',
      status: 'error',
      closable: true,
    }
  }

  const rows = table.rows.length
  const cols = Math.max(table.headers?.length ?? 0, ...table.rows.map((r) => r.length))

  // Row limit exceeded
  if (totalRowCount && totalRowCount > MAX_IMPORT_ROWS) {
    return {
      title: 'Table truncated',
      description: `The pasted table had ${totalRowCount} rows. Only the first ${MAX_IMPORT_ROWS} rows were imported. For very large tables, consider splitting into multiple tables.`,
      status: 'warning',
      closable: true,
    }
  }

  // Partial parse — some cells had warnings
  if (warnings.length > 0) {
    return {
      title: 'Table imported with warnings',
      description: `${warnings.length} cell(s) contained content that could not be fully imported (e.g. images, formulas, embedded objects). Look for the highlighted placeholder cells to fill in manually.`,
      status: 'warning',
      closable: true,
    }
  }

  // Clean success
  const formatNote = isRichFormat ? ' with formatting preserved' : ' imported as plain text'
  return {
    title: 'Table imported',
    description: `${rows} × ${cols} table${formatNote}.`,
    status: 'success',
    closable: true,
  }
}
