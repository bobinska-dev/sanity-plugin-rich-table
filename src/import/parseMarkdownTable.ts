import {markdownToPortableText} from '@portabletext/markdown'
import type {PortableTextBlock} from 'sanity'

import {generateKey} from '../utils/generateKey'
import {cellToText} from './cellToText'
import {createPlaceholderBlock} from './placeholders'
import type {CellValue, ParseResult, ParseWarning} from './types'
import {MAX_IMPORT_ROWS} from './types'

/**
 * Matches the separator row: `| --- | :---: | ---: |` (with optional alignment
 * markers), with OR without the outer pipes — `--- | ---` is valid
 * GitHub-flavored markdown. Requires at least one pipe and one dash so a plain
 * `---` thematic break isn't mistaken for a single-column separator, and a prose
 * line (which contains letters) can never match.
 */
const SEPARATOR_RE = /^(?=[^|]*\|)(?=[^-]*-)[\s:|-]+$/

/** Fast check: only invoke the markdown parser if the cell might contain inline syntax. */
const MD_INLINE_RE = /[*`~[!]/

/** Detects full bold wrapping: `**text**` or `__text__`. */
const BOLD_WRAP_RE = /^\*\*.*\*\*$|^__.*__$/

/**
 * Parses a markdown pipe-delimited table into a {@link ParseResult}.
 *
 * Expected format:
 * ```
 * | Header 1 | Header 2 |
 * | -------- | -------- |
 * | Cell 1   | Cell 2   |
 * ```
 *
 * Inline formatting (bold, italic, inline code, strikethrough, and
 * `[link](url)`) is converted to Portable Text via `@portabletext/markdown`.
 * Image blocks (`![alt](url)`) are replaced with placeholder cells.
 *
 * Common sources: GitHub, Notion markdown export, Obsidian, Confluence export.
 */
export function parseMarkdownTable(text: string): ParseResult {
  const warnings: ParseWarning[] = []
  const lines = text
    .split(/\r\n|\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const separatorIdx = lines.findIndex((line) => SEPARATOR_RE.test(line))

  if (separatorIdx === -1) {
    return {table: {headers: null, rows: []}, warnings}
  }

  // Split on column pipes only. An escaped pipe (`\|`) is a literal `|` inside a
  // cell, not a delimiter, so split on unescaped pipes (negative lookbehind) and
  // un-escape the survivors. The leading/trailing pipe strips likewise leave an
  // escaped edge pipe intact.
  const parseLine = (line: string): string[] =>
    line
      .replace(/^\|/, '')
      .replace(/(?<!\\)\|$/, '')
      .split(/(?<!\\)\|/)
      .map((cell) => cell.replace(/\\\|/g, '|').trim())

  const rawHeaders = separatorIdx > 0 ? parseLine(lines[separatorIdx - 1]) : null
  const headers = rawHeaders
    ? rawHeaders.map((h) => {
        if (!MD_INLINE_RE.test(h)) return h
        const blocks = markdownToPortableText(h, {keyGenerator: generateKey})
        return cellToText(blocks as unknown as PortableTextBlock[])
      })
    : null

  const bodyLines = lines.slice(separatorIdx + 1).filter((l) => l.includes('|'))

  const allRawRows = bodyLines.map(parseLine)
  const truncated = allRawRows.length > MAX_IMPORT_ROWS
  const rawRows = truncated ? allRawRows.slice(0, MAX_IMPORT_ROWS) : allRawRows

  // Row titles only when the first column actually has bold-wrapped labels. An
  // all-empty first column must NOT be misread as titles — `every()` is vacuously
  // true when every first cell is empty — so require at least one non-empty label.
  const firstColumnCells = rawRows.map((row) => row[0] ?? '').filter((cell) => cell !== '')
  const hasRowTitles =
    firstColumnCells.length > 0 && firstColumnCells.every((cell) => BOLD_WRAP_RE.test(cell))

  const rows: CellValue[][] = rawRows.map((row, rowIdx) =>
    row.map((cell, colIdx) => parseMarkdownCell(cell, rowIdx, colIdx, warnings)),
  )

  return {
    table: {headers, rows, hasRowTitles: hasRowTitles || undefined},
    warnings,
    ...(truncated ? {totalRows: allRawRows.length} : {}),
  }
}

/**
 * Converts a single markdown cell string to a {@link CellValue}.
 * Plain cells (no inline syntax) are returned as-is for efficiency.
 * Cells with inline formatting are parsed to Portable Text blocks.
 */
function parseMarkdownCell(
  cell: string,
  rowIdx: number,
  colIdx: number,
  warnings: ParseWarning[],
): CellValue {
  if (!cell || !MD_INLINE_RE.test(cell)) return cell

  const blocks = markdownToPortableText(cell, {
    keyGenerator: generateKey,
  }) as unknown as PortableTextBlock[]

  return blocks.flatMap((block) => {
    if (block._type === 'image') {
      warnings.push({row: rowIdx, col: colIdx, reason: 'image'})
      return [createPlaceholderBlock('image')]
    }
    return [block]
  })
}
