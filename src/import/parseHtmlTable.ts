import type {PortableTextBlock} from 'sanity'

import {generateKey} from '../utils/generateKey'
import {createPlaceholderBlock} from './placeholders'
import type {CellValue, ParseResult, ParseWarning} from './types'
import {MAX_IMPORT_ROWS} from './types'

/** Tags that map directly to Portable Text decorators. */
const DECORATOR_TAGS: Record<string, string> = {
  B: 'strong',
  STRONG: 'strong',
  I: 'em',
  EM: 'em',
  CODE: 'code',
  U: 'underline',
  INS: 'underline',
  S: 'strike-through',
  DEL: 'strike-through',
  STRIKE: 'strike-through',
}

/** Unparseable element tags that produce placeholder cells. */
const PLACEHOLDER_TAGS: Record<string, string> = {
  IMG: 'image',
  IFRAME: 'embedded media',
  VIDEO: 'embedded media',
  AUDIO: 'embedded media',
  OBJECT: 'embedded media',
  EMBED: 'embedded media',
  CANVAS: 'complex content',
  SVG: 'complex content',
}

/**
 * Elements whose text content is never user-visible prose. Their text must not
 * leak into an imported cell as spans, so they're skipped wherever they appear
 * — at block level or nested anywhere inside inline content.
 */
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'HEAD'])

/** Safe URL schemes for pasted links. */
const ALLOWED_HREF_SCHEMES = ['http', 'https', 'mailto', 'tel']

/**
 * A table's OWN rows (direct, or via thead/tbody/tfoot) — NOT rows from a table
 * nested inside a cell. `querySelectorAll('tr')` is recursive and would pull a
 * nested table's rows into the outer table, corrupting the row structure.
 */
function getTableRows(table: Element): Element[] {
  return Array.from(
    table.querySelectorAll(
      ':scope > tr, :scope > thead > tr, :scope > tbody > tr, :scope > tfoot > tr',
    ),
  )
}

/** A row's OWN cells (direct children), so a nested table's cells don't leak in. */
function getRowCells(row: Element): Element[] {
  return Array.from(row.querySelectorAll(':scope > td, :scope > th'))
}

/** Parse a colspan/rowspan attribute to a positive integer (default 1). */
function parseSpan(value: string | null): number {
  const n = parseInt(value ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}

/**
 * Expand `<tr>` rows into a rectangular occupancy grid honouring colspan/rowspan:
 * a merged cell fills its top-left slot with the cell element and the remaining
 * covered slots with `null` (rendered as empty cells), so every column stays
 * aligned instead of shifting left after a merge. Ragged rows are padded to the
 * widest row so the result is rectangular.
 */
function buildCellGrid(rowEls: Element[]): (Element | null)[][] {
  const grid: (Element | null)[][] = rowEls.map(() => [])
  rowEls.forEach((tr, r) => {
    let col = 0
    for (const cell of getRowCells(tr)) {
      // Skip columns already occupied by a rowspan carried down from above.
      while (grid[r][col] !== undefined) col++
      const colspan = parseSpan(cell.getAttribute('colspan'))
      const rowspan = parseSpan(cell.getAttribute('rowspan'))
      for (let dr = 0; dr < rowspan && r + dr < rowEls.length; dr++) {
        for (let dc = 0; dc < colspan; dc++) {
          grid[r + dr][col + dc] = dr === 0 && dc === 0 ? cell : null
        }
      }
      col += colspan
    }
  })
  const maxCols = grid.reduce((max, row) => Math.max(max, row.length), 0)
  return grid.map((row) => {
    const padded = row.slice()
    for (let c = 0; c < maxCols; c++) if (padded[c] === undefined) padded[c] = null
    return padded
  })
}

/**
 * Allow only safe URL schemes for a pasted link; drop `javascript:` / `data:` /
 * etc. so an imported href can't smuggle a script or data URL. Relative, anchor
 * and protocol-relative links pass through.
 */
function sanitizeHref(href: string | null): string | undefined {
  const trimmed = href?.trim()
  if (!trimmed) return undefined
  // Browsers strip TAB/LF/CR (and other C0 control chars) from URLs before
  // navigating, so `java\tscript:` becomes `javascript:` at click time. `.trim()`
  // only removes leading/trailing whitespace, so an interior control char would
  // otherwise defeat the scheme check (the scheme regex fails to match → treated
  // as a "relative" URL and passed through). Strip only C0 control chars (< 0x20)
  // FIRST, then detect the scheme against the cleaned value. A literal space (0x20)
  // is NOT a control char and doesn't enable the bypass (browsers don't ignore it
  // mid-scheme), so it's preserved — dropping it would mangle legit URLs like
  // `?q=hello world`.
  const cleaned = Array.from(trimmed)
    .filter((c) => c.charCodeAt(0) >= 0x20)
    .join('')
  if (!cleaned) return undefined
  if (/^(#|\/|\.{1,2}\/)/.test(cleaned)) return cleaned
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(cleaned)?.[1]?.toLowerCase()
  if (!scheme) return cleaned // no scheme → relative path
  return ALLOWED_HREF_SCHEMES.includes(scheme) ? cleaned : undefined
}

/**
 * Parses an HTML string containing a `<table>` into a {@link ParseResult},
 * preserving rich formatting (decorators, links, lists) as Portable Text.
 *
 * Uses the browser's built-in `DOMParser` for robust handling of malformed
 * markup from Google Sheets, Excel, Notion, and arbitrary web pages.
 */
export function parseHtmlTable(html: string): ParseResult {
  const warnings: ParseWarning[] = []
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const table = doc.querySelector('table')

  if (!table) {
    return {table: {headers: null, rows: []}, warnings}
  }

  const htmlRows = getTableRows(table)

  if (htmlRows.length === 0) {
    return {table: {headers: null, rows: []}, warnings}
  }

  // Detect header row: <th> cells, or all-bold first row (common in Google Sheets / web tables)
  const firstRowCells = getRowCells(htmlRows[0])
  const hasThHeader = firstRowCells.length > 0 && firstRowCells.every((c) => c.tagName === 'TH')
  const hasBoldHeader = !hasThHeader && isFirstRowAllBold(htmlRows[0])

  // Labeled-matrix header: a table with bold row titles down the first column
  // AND an empty top-left corner almost always carries a column-header row
  // across the top — even when those header cells are plain text (not bold, not
  // <th>). This is the classic spreadsheet "matrix" layout (empty corner,
  // labels on both axes) that Google Sheets / Excel paste with plain top cells.
  const hasMatrixHeader =
    !hasThHeader &&
    !hasBoldHeader &&
    firstRowCells.length >= 2 &&
    isCellEmpty(firstRowCells[0]) &&
    firstRowCells.slice(1).some((c) => !isCellEmpty(c)) &&
    isFirstColumnAllBold(htmlRows)

  const hasHeader = (hasThHeader || hasBoldHeader || hasMatrixHeader) && htmlRows.length >= 2

  // Cap body rows before expanding (bounds work + memory on very large pastes).
  const bodyHtmlRows = hasHeader ? htmlRows.slice(1) : htmlRows
  const truncated = bodyHtmlRows.length > MAX_IMPORT_ROWS
  const limitedRows = bodyHtmlRows.slice(0, MAX_IMPORT_ROWS)

  // Expand colspan/rowspan into a rectangular grid (header + capped body) so cells
  // stay column-aligned even when the source merges cells.
  const gridRowEls = hasHeader ? [htmlRows[0], ...limitedRows] : limitedRows
  const grid = buildCellGrid(gridRowEls)
  const maxCols = grid.reduce((max, row) => Math.max(max, row.length), 0)

  const headerGridRow = hasHeader ? grid[0] : null
  const headers = headerGridRow
    ? Array.from({length: maxCols}, (_, c) => headerGridRow[c]?.textContent?.trim() ?? '')
    : null

  const bodyGrid = hasHeader ? grid.slice(1) : grid
  const rows: CellValue[][] = bodyGrid.map((gridRow, rowIdx) =>
    Array.from({length: maxCols}, (_, colIdx) => {
      const cell = gridRow[colIdx]
      if (!cell) return [] // empty cell, or a slot covered by a colspan/rowspan
      const {blocks, cellWarnings} = parseCellContent(cell, rowIdx, colIdx)
      warnings.push(...cellWarnings)
      return blocks
    }),
  )

  // Detect bold first column as row titles
  const hasRowTitles = isFirstColumnAllBold(limitedRows)

  return {
    table: {headers, rows, hasRowTitles},
    warnings,
    ...(truncated ? {totalRows: bodyHtmlRows.length} : {}),
  }
}

/**
 * Returns `true` when every non-empty cell in a `<tr>` has its entire text
 * content styled bold — either via `<b>`/`<strong>` wrapper tags or via
 * `font-weight: bold|700+` CSS on the `<td>` or an immediate child element.
 *
 * Used as a heuristic to detect header rows that use bold styling instead of
 * `<th>` tags (common in Google Sheets and many web tables).
 */
function isFirstRowAllBold(row: Element): boolean {
  const cells = getRowCells(row)
  if (cells.length === 0) return false

  const nonEmptyCells = cells.filter((c) => (c.textContent?.trim() ?? '').length > 0)
  if (nonEmptyCells.length === 0) return false

  return nonEmptyCells.every((cell) => isCellEntirelyBold(cell))
}

/** Returns `true` when a cell has no non-whitespace text content. */
function isCellEmpty(cell: Element | undefined): boolean {
  return !cell || (cell.textContent?.trim() ?? '').length === 0
}

/**
 * Returns `true` when every non-empty first cell across the data rows is bold.
 * Used to auto-detect row titles (the first column styled as headers).
 */
function isFirstColumnAllBold(dataRows: Element[]): boolean {
  if (dataRows.length === 0) return false

  const firstCells = dataRows
    .map((tr) => {
      const cells = getRowCells(tr)
      return cells.length > 0 ? cells[0] : null
    })
    .filter((c): c is Element => c !== null)

  if (firstCells.length === 0) return false

  const nonEmpty = firstCells.filter((c) => (c.textContent?.trim() ?? '').length > 0)
  if (nonEmpty.length === 0) return false

  return nonEmpty.every((cell) => isCellEntirelyBold(cell))
}

/**
 * Checks whether ALL text inside a cell is styled bold.
 *
 * Walks the DOM tree recursively: once a bold ancestor is found, all text
 * beneath it counts as bold. Bare text nodes at a non-bold level mean the
 * cell is not entirely bold. Handles Google Sheets' common
 * `<td><div><span style="font-weight:bold">text</span></div></td>` nesting.
 */
function isCellEntirelyBold(cell: Element): boolean {
  return isAllTextBold(cell)
}

/** Recursive helper: returns `true` when every text node under `el` has a bold ancestor. */
function isAllTextBold(el: Element): boolean {
  if (isBoldElement(el)) return true

  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      if ((node.textContent?.trim() ?? '').length > 0) {
        return false
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (!isAllTextBold(node as Element)) return false
    }
  }

  return true
}

function isBoldElement(el: Element): boolean {
  const tag = el.tagName
  if (tag === 'B' || tag === 'STRONG') return true

  const style = el.getAttribute('style')
  if (style && /font-weight\s*:\s*(bold|[7-9]\d{2})/i.test(style)) return true

  return false
}

interface CellParseResult {
  blocks: PortableTextBlock[]
  cellWarnings: ParseWarning[]
}

/** Converts a single `<td>` or `<th>` element into Portable Text blocks. */
function parseCellContent(cell: Element, rowIdx: number, colIdx: number): CellParseResult {
  const cellWarnings: ParseWarning[] = []
  const blocks: PortableTextBlock[] = []

  // Check for Google Sheets formula marker
  if (cell.hasAttribute('data-sheets-formula')) {
    const formulaText = cell.textContent?.trim() ?? ''
    const isError = /^#(REF|N\/A|VALUE|DIV\/0|NAME\?|NULL|NUM)!?$/i.test(formulaText)

    if (isError || formulaText === '') {
      blocks.push(createPlaceholderBlock('formula — enter value manually'))
      cellWarnings.push({row: rowIdx, col: colIdx, reason: 'formula'})
      return {blocks, cellWarnings}
    }
    // Formula computed successfully — use the displayed value (fall through)
  }

  // Walk child nodes and group into blocks
  const pendingBlocks = extractBlocks(cell, cellWarnings, rowIdx, colIdx)

  if (pendingBlocks.length === 0) {
    // Empty cell — still checked for non-text content that was skipped
    return {blocks: [], cellWarnings}
  }

  blocks.push(...pendingBlocks)
  return {blocks, cellWarnings}
}

/** Extracts PT blocks from a cell element, handling paragraphs, lists, and inline content. */
/**
 * Converts an element's block-level children (paragraphs, headings, lists,
 * blockquotes, inline runs) into Portable Text blocks, preserving inline
 * decorators and link annotations. Used for table-cell content and — via
 * {@link htmlPasteToBlocks} — for the prose around a pasted table.
 */
export function extractBlocks(
  cell: Element,
  warnings: ParseWarning[],
  rowIdx: number,
  colIdx: number,
): PortableTextBlock[] {
  const blocks: PortableTextBlock[] = []
  const children = Array.from(cell.childNodes)

  // If the cell only has inline content (no <p>, <ul>, <ol>), treat as a single block
  const hasBlockElements = children.some(
    (n) =>
      n.nodeType === Node.ELEMENT_NODE &&
      /^(P|UL|OL|DIV|BLOCKQUOTE|H[1-6])$/.test((n as Element).tagName),
  )

  if (!hasBlockElements) {
    const spans = extractSpans(cell, warnings, rowIdx, colIdx)
    if (spans.children.length > 0) {
      blocks.push(buildBlock(spans.children, spans.markDefs))
    }
    return blocks
  }

  for (const child of children) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim() ?? ''
      if (text) {
        blocks.push(buildBlock([buildSpan(text)], []))
      }
      continue
    }

    if (child.nodeType !== Node.ELEMENT_NODE) continue

    const el = child as Element
    const tag = el.tagName

    if (SKIP_TAGS.has(tag)) continue

    if (/^H[1-6]$/.test(tag)) {
      // Preserve the heading level (<h2> → "h2") rather than flattening to a
      // paragraph, so imported headings keep their semantics in the cell editor.
      const spans = extractSpans(el, warnings, rowIdx, colIdx)
      if (spans.children.length > 0) {
        blocks.push(buildBlock(spans.children, spans.markDefs, tag.toLowerCase()))
      }
    } else if (tag === 'P' || tag === 'DIV') {
      const spans = extractSpans(el, warnings, rowIdx, colIdx)
      if (spans.children.length > 0) {
        blocks.push(buildBlock(spans.children, spans.markDefs, 'normal'))
      }
    } else if (tag === 'UL' || tag === 'OL') {
      const listType = tag === 'UL' ? 'bullet' : 'number'
      const listItems = Array.from(el.querySelectorAll(':scope > li'))
      for (const li of listItems) {
        const spans = extractSpans(li, warnings, rowIdx, colIdx)
        if (spans.children.length > 0) {
          blocks.push(buildListBlock(spans.children, spans.markDefs, listType, 1))
        }
      }
    } else if (tag === 'BLOCKQUOTE') {
      const spans = extractSpans(el, warnings, rowIdx, colIdx)
      if (spans.children.length > 0) {
        blocks.push(buildBlock(spans.children, spans.markDefs, 'blockquote'))
      }
    } else {
      // Unknown block-level element — try to extract inline content
      const spans = extractSpans(el, warnings, rowIdx, colIdx)
      if (spans.children.length > 0) {
        blocks.push(buildBlock(spans.children, spans.markDefs))
      }
    }
  }

  return blocks
}

interface SpanResult {
  children: PTSpan[]
  markDefs: PTMarkDef[]
}

interface PTSpan {
  _type: 'span'
  _key: string
  text: string
  marks: string[]
}

interface PTMarkDef {
  _type: string
  _key: string
  [key: string]: unknown
}

/** Recursively extracts inline spans from an element, preserving decorators and annotations. */
function extractSpans(
  el: Element | Node,
  warnings: ParseWarning[],
  rowIdx: number,
  colIdx: number,
  // Recursion-carried accumulators, bundled so external callers pass only the
  // four positional args (keeps the param count within lint limits).
  carry: {inheritedMarks?: string[]; markDefs?: PTMarkDef[]} = {},
): SpanResult {
  const inheritedMarks = carry.inheritedMarks ?? []
  const markDefs = carry.markDefs ?? []
  const children: PTSpan[] = []

  // Merge marks from the container element itself (tag name + inline styles).
  // This catches styles applied directly to <td>, <p>, <div>, etc. that would
  // otherwise be invisible since only child elements were checked before.
  // The includes() guards prevent double-application on recursive calls where
  // the parent already computed the child element's marks.
  const effectiveMarks = [...inheritedMarks]
  if (el.nodeType === Node.ELEMENT_NODE) {
    const elem = el as Element
    const tag = elem.tagName
    if (tag in DECORATOR_TAGS) {
      const dec = DECORATOR_TAGS[tag]
      if (!effectiveMarks.includes(dec)) effectiveMarks.push(dec)
    }
    addStyleBasedMarks(elem, effectiveMarks)
  }

  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? ''
      if (text) {
        children.push(...splitBacktickSpans(text, effectiveMarks))
      }
      continue
    }

    if (node.nodeType !== Node.ELEMENT_NODE) continue

    const childEl = node as Element
    const tag = childEl.tagName

    // Non-content elements (script/style/etc.) carry text that must never surface
    // as prose — drop them entirely rather than recursing into their text nodes.
    if (SKIP_TAGS.has(tag)) continue

    // Emit a visible placeholder span for unparseable content (images, embeds, etc.)
    if (tag in PLACEHOLDER_TAGS) {
      const reason = PLACEHOLDER_TAGS[tag]
      warnings.push({row: rowIdx, col: colIdx, reason})
      children.push(buildSpan(`⚠️ [Could not import: ${reason}]`, ['code']))
      continue
    }

    if (tag === 'BR') {
      children.push(buildSpan('\n', effectiveMarks))
      continue
    }

    // Compute marks for this child element
    const marks = [...effectiveMarks]

    // Tag-based decorators
    if (tag in DECORATOR_TAGS) {
      const dec = DECORATOR_TAGS[tag]
      if (!marks.includes(dec)) marks.push(dec)
    }

    // CSS inline style fallbacks
    addStyleBasedMarks(childEl, marks)

    // Link annotation (href sanitized: only safe schemes, no javascript:/data:)
    if (tag === 'A') {
      const href = sanitizeHref(childEl.getAttribute('href'))
      if (href) {
        const markKey = generateKey()
        markDefs.push({_type: 'link', _key: markKey, href})
        if (!marks.includes(markKey)) marks.push(markKey)
      }
    }

    // Recurse into children
    const nested = extractSpans(childEl, warnings, rowIdx, colIdx, {
      inheritedMarks: marks,
      markDefs,
    })
    children.push(...nested.children)
  }

  return {children, markDefs}
}

/** Detects decorators from CSS inline styles (common in Google Sheets / Excel HTML). */
function addStyleBasedMarks(el: Element, marks: string[]): void {
  const style = el.getAttribute('style')
  if (!style) return

  if (/font-weight\s*:\s*(bold|[7-9]\d{2})/i.test(style) && !marks.includes('strong')) {
    marks.push('strong')
  }
  if (/font-style\s*:\s*italic/i.test(style) && !marks.includes('em')) {
    marks.push('em')
  }
  if (/text-decoration[^:]*:\s*[^;]*underline/i.test(style) && !marks.includes('underline')) {
    marks.push('underline')
  }
  if (
    /text-decoration[^:]*:\s*[^;]*line-through/i.test(style) &&
    !marks.includes('strike-through')
  ) {
    marks.push('strike-through')
  }
}

/**
 * Splits a text string on backtick-wrapped segments and returns
 * spans where the inner text gets the `code` decorator applied. Surrounding
 * backticks are stripped. Segments outside backticks are returned as plain spans.
 *
 * Google Sheets and many web sources paste backtick-wrapped text as literal
 * characters rather than `<code>` elements, so this heuristic bridges the gap.
 */
function splitBacktickSpans(text: string, marks: string[]): PTSpan[] {
  const parts = text.split(/(`[^`]+`)/)
  const spans: PTSpan[] = []

  for (const part of parts) {
    if (!part) continue
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      const inner = part.slice(1, -1)
      const codeMarks = marks.includes('code') ? marks : [...marks, 'code']
      spans.push(buildSpan(inner, codeMarks))
    } else {
      spans.push(buildSpan(part, marks))
    }
  }

  return spans
}

function buildSpan(text: string, marks: string[] = []): PTSpan {
  return {_type: 'span', _key: generateKey(), text, marks: [...marks]}
}

function buildBlock(
  children: PTSpan[],
  markDefs: PTMarkDef[],
  style = 'normal',
): PortableTextBlock {
  return {
    _type: 'block',
    _key: generateKey(),
    style,
    markDefs: dedupeMarkDefs(markDefs),
    children,
  } as unknown as PortableTextBlock
}

function buildListBlock(
  children: PTSpan[],
  markDefs: PTMarkDef[],
  listItem: 'bullet' | 'number',
  level: number,
): PortableTextBlock {
  return {
    _type: 'block',
    _key: generateKey(),
    style: 'normal',
    listItem,
    level,
    markDefs: dedupeMarkDefs(markDefs),
    children,
  } as unknown as PortableTextBlock
}

/** Removes duplicate mark definitions (same `_key`). */
function dedupeMarkDefs(defs: PTMarkDef[]): PTMarkDef[] {
  const seen = new Set<string>()
  return defs.filter((d) => {
    if (seen.has(d._key)) return false
    seen.add(d._key)
    return true
  })
}
