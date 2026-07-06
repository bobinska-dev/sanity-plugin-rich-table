import type {PortableTextBlock} from 'sanity'

import {extractBlocks, parseHtmlTable} from './parseHtmlTable'
import {toRichTableValue} from './toRichTableValue'
import type {ParseWarning} from './types'

/**
 * Converts a mixed HTML clipboard payload (prose interleaved with one or more
 * `<table>` elements) into an ordered array of Portable Text blocks: prose is
 * converted to standard blocks (via {@link extractBlocks}, preserving inline
 * decorators and links), and each table becomes a `richTable` block (via
 * {@link parseHtmlTable} + {@link toRichTableValue}).
 *
 * Why this exists: the pure-table paste path only fires when the clipboard is
 * essentially just a table, and the markdown path only fires when the plain
 * text carries a markdown signal. A table copied alongside prose from a web
 * page or document arrives as HTML with no markdown signal, so this handler
 * bridges that gap while keeping the surrounding prose.
 *
 * Order is preserved by walking the document in document order and flushing the
 * buffered prose whenever a table is reached. Elements that merely *contain* a
 * table (e.g. a wrapping `<div>`) are recursed into so the table is lifted out
 * rather than flattened into prose.
 */
export function htmlPasteToBlocks(html: string): PortableTextBlock[] {
  if (!html) return []

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const out: PortableTextBlock[] = []
  // Warnings (unimportable cells) are surfaced by the parser but not needed here.
  const warnings: ParseWarning[] = []

  processNodes(Array.from(doc.body.childNodes), doc, warnings, out)

  return out
}

function processNodes(
  nodes: Node[],
  doc: Document,
  warnings: ParseWarning[],
  out: PortableTextBlock[],
): void {
  let proseBuffer: Node[] = []

  const flushProse = () => {
    if (proseBuffer.length === 0) return
    const wrapper = doc.createElement('div')
    for (const node of proseBuffer) wrapper.appendChild(node.cloneNode(true))
    out.push(...extractBlocks(wrapper, warnings, 0, 0))
    proseBuffer = []
  }

  for (const node of nodes) {
    const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : null

    if (el && el.tagName === 'TABLE') {
      flushProse()
      const parsed = parseHtmlTable(el.outerHTML)
      if (parsed.table.rows.length > 0) {
        out.push(toRichTableValue(parsed.table) as unknown as PortableTextBlock)
      }
    } else if (el && el.querySelector('table')) {
      // A wrapper element that contains a table somewhere inside — recurse so
      // the table is lifted out instead of being flattened into prose.
      flushProse()
      processNodes(Array.from(el.childNodes), doc, warnings, out)
    } else {
      proseBuffer.push(node)
    }
  }

  flushProse()
}
