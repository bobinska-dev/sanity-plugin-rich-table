import type {TableFormat} from './types'

/**
 * Detects the most appropriate table format from clipboard data.
 *
 * Priority order: **HTML** (richest data, definitive `<table>` signal), then
 * **Markdown** (structural `|` + separator row), then **TSV** (weakest signal,
 * broadest fallback). CSV is intentionally excluded from auto-detection
 * because commas are too common in natural text.
 *
 * @param html - The `text/html` clipboard payload (may be empty).
 * @param plain - The `text/plain` clipboard payload (may be empty).
 * @returns The detected format, or `null` if no table data is detected.
 */
export function detectFormat(html: string, plain: string): TableFormat | null {
  // 1. HTML table — richest signal
  if (html && /<table[\s>]/i.test(html)) return 'html'

  // 2. Markdown table — pipe delimiters + separator row
  if (plain && isMarkdownTable(plain)) return 'markdown'

  // 3. TSV — at least 2 rows × 2 columns
  if (plain && isTsvTable(plain)) return 'tsv'

  return null
}

/** Markdown table: lines bounded by `|` with a separator row of `|---...|`. */
function isMarkdownTable(text: string): boolean {
  return /^\|.*\|$/m.test(text) && /^\|[\s:|-]+\|$/m.test(text)
}

/** TSV: at least 2 lines each containing at least one tab. */
function isTsvTable(text: string): boolean {
  const lines = text.split(/\r\n|\n/).filter((l) => l.includes('\t'))
  if (lines.length < 2) return false
  // At least 2 columns in the first line
  return lines[0].split('\t').length >= 2
}
