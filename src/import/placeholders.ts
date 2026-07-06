import {keyGenerator as generateKey} from '@portabletext/editor'
import type {PortableTextBlock} from 'sanity'

/** Prefix prepended to placeholder text so editors can visually scan for incomplete cells. */
export const PLACEHOLDER_PREFIX = '⚠️ '

/**
 * Creates a placeholder Portable Text block for a cell whose content could not
 * be imported. Uses the `code` decorator to visually distinguish the marker in
 * both light and dark mode.
 *
 * @param reason - Human-readable description of what could not be imported
 *   (e.g. "image", "formula — enter value manually").
 */
export function createPlaceholderBlock(reason: string): PortableTextBlock {
  return {
    _type: 'block',
    _key: generateKey(),
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: generateKey(),
        text: `${PLACEHOLDER_PREFIX}[Could not import: ${reason}]`,
        marks: ['code'],
      },
    ],
  } as unknown as PortableTextBlock
}

/**
 * Creates the minimum valid cell content array required by `sanity-plugin-rich-table`.
 *
 * Every cell — including empty ones — **must** have a `content` array with at
 * least one block containing an empty span. Without this the embedded Portable
 * Text editor will not render correctly.
 *
 * @see https://github.com/bobinska-dev/sanity-plugin-rich-table/blob/main/docs/data-structure.md
 */
export function createEmptyBlockContent(): PortableTextBlock[] {
  return [
    {
      _type: 'block',
      _key: generateKey(),
      markDefs: [],
      children: [{_type: 'span', _key: generateKey(), text: '', marks: []}],
    } as unknown as PortableTextBlock,
  ]
}

/**
 * Wraps a plain-text string in a minimal Portable Text block suitable for a
 * table cell's `content` array.
 */
export function createTextBlock(text: string): PortableTextBlock {
  return {
    _type: 'block',
    _key: generateKey(),
    markDefs: [],
    children: [{_type: 'span', _key: generateKey(), text, marks: []}],
  } as unknown as PortableTextBlock
}
