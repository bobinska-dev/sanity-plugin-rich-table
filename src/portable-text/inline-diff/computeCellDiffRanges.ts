import {inlineTextDiff} from '../../utils/inlineTextDiff'

/**
 * A block-relative range to decorate in the live editor when inline changes are
 * shown. Offsets are character offsets within a single text block's text, in the
 * **current** value's coordinate system (so they can be mapped to an editor
 * selection). Removed text isn't present in the current value, so its range is
 * collapsed (`start === end`) and carries the deleted `text` to render.
 */
export interface CellDiffRange {
  blockKey: string
  type: 'added' | 'removed'
  start: number
  end: number
  /** The deleted text for `removed` ranges; empty for `added` ranges. */
  text: string
}

function keyOf(block: unknown): string | undefined {
  const key = (block as {_key?: unknown} | null)?._key
  return typeof key === 'string' && key ? key : undefined
}

/**
 * Whether a block is an editable text block (vs. an image / custom block object).
 * Only text blocks carry inline text changes; block objects are compared by the
 * grid/dialog diff, not decorated in the editor.
 */
function isTextBlock(block: unknown): block is {_key?: string; children?: unknown[]} {
  return (
    !!block &&
    typeof block === 'object' &&
    (block as {_type?: unknown})._type === 'block' &&
    Array.isArray((block as {children?: unknown}).children)
  )
}

/**
 * Plain text of a text block: the concatenation of its spans' text. Matches
 * {@link portableTextToPlain}'s per-block extraction so offsets line up with the
 * same text model used across the diff UI. Inline objects (rare in cells) are
 * treated as empty, so a mid-block inline object can shift later offsets — a
 * decoration that then falls out of range is skipped rather than misplaced.
 */
function textOfBlock(block: {children?: unknown[]}): string {
  const children = block.children
  if (!Array.isArray(children)) return ''
  return children
    .map((child) => {
      const text = (child as {text?: unknown} | null)?.text
      return typeof text === 'string' ? text : ''
    })
    .join('')
}

/**
 * Compute the inline text changes between a cell's previous and current Portable
 * Text, as decoratable ranges. Blocks are paired by `_key`; each common text
 * block is word-diffed, a text block only in the current value is fully "added",
 * and a text block only in the previous value has no anchor in the editor so it
 * is left to the grid/dialog diff. Pure and defensive — never throws.
 */
export function computeCellDiffRanges(before: unknown, current: unknown): CellDiffRange[] {
  const beforeBlocks = Array.isArray(before) ? before : []
  const currentBlocks = Array.isArray(current) ? current : []

  const beforeTextByKey = new Map<string, string>()
  for (const block of beforeBlocks) {
    const key = keyOf(block)
    if (key && isTextBlock(block)) beforeTextByKey.set(key, textOfBlock(block))
  }

  const ranges: CellDiffRange[] = []
  for (const block of currentBlocks) {
    if (!isTextBlock(block)) continue
    const key = keyOf(block)
    if (!key) continue

    const currentText = textOfBlock(block)
    const beforeText = beforeTextByKey.get(key) ?? ''
    if (beforeText === currentText) continue

    // Walk the diff in current-value coordinates: unchanged/added advance the
    // offset; a removed run stays put (it isn't in the current text).
    let offset = 0
    for (const segment of inlineTextDiff(beforeText, currentText)) {
      if (segment.status === 'unchanged') {
        offset += segment.value.length
      } else if (segment.status === 'added') {
        ranges.push({
          blockKey: key,
          type: 'added',
          start: offset,
          end: offset + segment.value.length,
          text: '',
        })
        offset += segment.value.length
      } else {
        ranges.push({
          blockKey: key,
          type: 'removed',
          start: offset,
          end: offset,
          text: segment.value,
        })
      }
    }
  }

  return ranges
}

/** A Portable Text selection point: a path to a span child plus an offset into
 * its text. Deliberately loose so we don't depend on `@portabletext/editor`'s
 * `/utils` subpath (whose types conflict with the toolbar schema). */
export interface CellSelectionPoint {
  path: Array<string | {_key: string}>
  offset: number
}

export interface CellSelection {
  anchor: CellSelectionPoint
  focus: CellSelectionPoint
}

/**
 * Map a block-relative character offset to a span selection point, walking the
 * block's spans and accumulating text length (same span-only model as
 * {@link computeCellDiffRanges}). An offset at/after the end lands at the end of
 * the last span. Returns `null` if the block has no spans.
 */
function offsetToPoint(
  block: {_key?: string; children?: unknown[]},
  offset: number,
): CellSelectionPoint | null {
  const blockKey = keyOf(block)
  const children = Array.isArray(block.children) ? block.children : []
  let accumulated = 0
  let lastSpan: {_key?: string; text: string} | null = null

  for (const child of children) {
    const text = (child as {text?: unknown} | null)?.text
    const spanKey = keyOf(child)
    if (typeof text !== 'string' || !spanKey || !blockKey) continue
    lastSpan = {_key: spanKey, text}
    if (offset <= accumulated + text.length) {
      return {
        path: [{_key: blockKey}, 'children', {_key: spanKey}],
        offset: offset - accumulated,
      }
    }
    accumulated += text.length
  }

  if (blockKey && lastSpan?._key) {
    return {
      path: [{_key: blockKey}, 'children', {_key: lastSpan._key}],
      offset: lastSpan.text.length,
    }
  }
  return null
}

/**
 * Resolve a diff range to an editor selection within the current value. Pure and
 * defensive: returns `null` if the target block/span can't be found, so a
 * decoration is skipped rather than misplaced.
 */
export function rangeToSelection(range: CellDiffRange, current: unknown): CellSelection | null {
  const blocks = Array.isArray(current) ? current : []
  const block = blocks.find((candidate) => keyOf(candidate) === range.blockKey)
  if (!isTextBlock(block)) return null

  const anchor = offsetToPoint(block, range.start)
  const focus = range.start === range.end ? anchor : offsetToPoint(block, range.end)
  if (!anchor || !focus) return null
  return {anchor, focus}
}
