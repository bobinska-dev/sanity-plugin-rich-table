import type {TableFormat} from './types'

/**
 * Tolerance for non-table text alongside a table in the clipboard payload.
 *
 * Real-world paste sources (Excel, Google Sheets, Notion) often wrap a `<table>`
 * with a few characters of metadata, fragment markers, or trailing whitespace.
 * We treat anything below this threshold as "pure table" content; anything
 * above it as a mixed paste that should fall through to default deserialisation.
 */
const NON_TABLE_TEXT_TOLERANCE = 20

/** Markdown separator row, e.g. `| --- | :---: |`. */
const MD_SEPARATOR_RE = /^\|[\s:|-]+\|$/
/** A markdown line that looks like a table row (bounded by pipes). */
const MD_ROW_RE = /^\|.*\|$/

/**
 * Returns `true` when the clipboard payload represents (essentially) just a
 * table — i.e. there is no significant non-table content surrounding it.
 *
 * The table-paste behavior interprets the clipboard as a single richTable block
 * and replaces the default paste deserialisation. That means any prose,
 * headings, lists, or other tables outside the parsed range would be silently
 * dropped. Use this guard to bail out for mixed-content pastes so PTE can
 * deserialise the whole payload normally.
 */
export function isPureTablePaste(html: string, plain: string, format: TableFormat): boolean {
  if (format === 'html') return isPureHtmlTablePaste(html)
  if (format === 'markdown') return isPureMarkdownTablePaste(plain)
  if (format === 'tsv') return isPureTsvPaste(plain)
  return false
}

function isPureHtmlTablePaste(html: string): boolean {
  if (!html) return false
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const bodyText = (doc.body?.textContent ?? '').trim()
    let tableText = ''
    for (const t of Array.from(doc.querySelectorAll('table'))) {
      tableText += (t.textContent ?? '').trim()
    }
    const surrounding = bodyText.length - tableText.length
    return surrounding <= NON_TABLE_TEXT_TOLERANCE
  } catch {
    return false
  }
}

function isPureMarkdownTablePaste(plain: string): boolean {
  if (!plain) return false
  const lines = plain.split(/\r\n|\n/)
  const trimmed = lines.map((l) => l.trim())

  const sepIdx = trimmed.findIndex((l) => MD_SEPARATOR_RE.test(l))
  if (sepIdx === -1 || sepIdx === 0) return false

  // Walk backwards from the separator to find the start of the table block.
  let start = sepIdx - 1
  while (start > 0 && MD_ROW_RE.test(trimmed[start - 1])) start--

  // Walk forwards to find the end of the table block.
  let end = sepIdx
  while (end + 1 < trimmed.length && MD_ROW_RE.test(trimmed[end + 1])) end++

  const before = trimmed.slice(0, start).join('').trim()
  const after = trimmed
    .slice(end + 1)
    .join('')
    .trim()
  return before.length + after.length <= NON_TABLE_TEXT_TOLERANCE
}

function isPureTsvPaste(plain: string): boolean {
  if (!plain) return false
  const nonEmpty = plain.split(/\r\n|\n/).filter((l) => l.trim().length > 0)
  if (nonEmpty.length === 0) return false
  return nonEmpty.every((l) => l.includes('\t'))
}
