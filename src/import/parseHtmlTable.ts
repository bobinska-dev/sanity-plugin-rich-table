import {keyGenerator as generateKey} from '@portabletext/editor'
import type {PortableTextBlock} from 'sanity'

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

  const htmlRows = Array.from(table.querySelectorAll('tr'))

  if (htmlRows.length === 0) {
    return {table: {headers: null, rows: []}, warnings}
  }

  // Detect header row: <th> cells, or all-bold first row (common in Google Sheets / web tables)
  const firstRowCells = Array.from(htmlRows[0].children)
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

  const headers = hasHeader ? firstRowCells.map((c) => c.textContent?.trim() ?? '') : null

  const bodyHtmlRows = hasHeader ? htmlRows.slice(1) : htmlRows
  const truncated = bodyHtmlRows.length > MAX_IMPORT_ROWS
  const limitedRows = bodyHtmlRows.slice(0, MAX_IMPORT_ROWS)

  const rows: CellValue[][] = limitedRows.map((tr, rowIdx) => {
    const cells = Array.from(tr.querySelectorAll('td, th'))
    return cells.map((td, colIdx) => {
      const {blocks, cellWarnings} = parseCellContent(td, rowIdx, colIdx)
      warnings.push(...cellWarnings)
      return blocks
    })
  })

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
  const cells = Array.from(row.querySelectorAll('td, th'))
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
      const cells = tr.querySelectorAll('td, th')
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

    if (tag === 'P' || tag === 'DIV' || /^H[1-6]$/.test(tag)) {
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

    // Link annotation
    if (tag === 'A') {
      const href = childEl.getAttribute('href')
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
