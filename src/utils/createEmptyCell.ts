import {PortableTextBlock} from 'sanity'

import {RichTableCellType} from '../schemas/cell.object'
import {generateKey} from './generateKey'

/**
 * Build a single empty Portable Text block.
 *
 * Every block **and** every span child must carry a `_key`. Sanity's Portable
 * Text input and `@portabletext/editor` both reject values with missing keys
 * ("Some items in the list are missing their keys") and can normalise a
 * key-less block into a malformed one that has lost its `_type`
 * ("Block … is missing a type name"). Generating the keys up front avoids both.
 */
export function createEmptyBlock(): PortableTextBlock {
  return {
    _type: 'block',
    _key: generateKey(),
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: generateKey(), text: '', marks: []}],
  } as unknown as PortableTextBlock
}

/**
 * Build an empty rich-table cell with a valid, fully-keyed Portable Text value.
 *
 * Shared by table initialisation ({@link ../components/InitialiseTable}) and the
 * add-row / add-column hooks so every code path that creates a cell produces the
 * same key-complete structure.
 */
export function createEmptyCell(): RichTableCellType {
  return {
    _type: 'richTableCell',
    _key: generateKey(),
    content: [createEmptyBlock()],
  }
}
