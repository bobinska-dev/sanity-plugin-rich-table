import {describe, expect, it} from 'vitest'

import {markdownPasteToBlocks} from '../markdownPasteToBlocks'
import {RICH_TABLE_BLOCK_TYPE} from '../toRichTableValue'

const typeOf = (block: unknown): string | undefined => (block as {_type?: string})?._type

describe('markdownPasteToBlocks', () => {
  it('returns an empty array for empty input', () => {
    expect(markdownPasteToBlocks('')).toEqual([])
  })

  it('emits a single richTable block for a table-only payload', () => {
    const md = ['| Name | Age |', '| --- | --- |', '| Alice | 30 |', '| Bob | 25 |'].join('\n')
    const blocks = markdownPasteToBlocks(md)

    const tables = blocks.filter((b) => typeOf(b) === RICH_TABLE_BLOCK_TYPE)
    expect(tables).toHaveLength(1)
  })

  it('keeps surrounding prose while converting the embedded table', () => {
    const md = [
      'Intro paragraph.',
      '',
      '| Name | Age |',
      '| --- | --- |',
      '| Alice | 30 |',
      '',
      'Closing paragraph.',
    ].join('\n')
    const blocks = markdownPasteToBlocks(md)

    const tables = blocks.filter((b) => typeOf(b) === RICH_TABLE_BLOCK_TYPE)
    const proseBlocks = blocks.filter((b) => typeOf(b) === 'block')

    expect(tables).toHaveLength(1)
    expect(proseBlocks.length).toBeGreaterThanOrEqual(2)
  })

  it('produces no richTable block for prose-only markdown', () => {
    const md = [
      '# Heading',
      '',
      'Just a paragraph of text with **bold** and a [link](https://x.y).',
    ].join('\n')
    const blocks = markdownPasteToBlocks(md)

    expect(blocks.some((b) => typeOf(b) === RICH_TABLE_BLOCK_TYPE)).toBe(false)
    expect(blocks.length).toBeGreaterThan(0)
  })

  it('gives every emitted block a _key', () => {
    const md = ['| A | B |', '| --- | --- |', '| 1 | 2 |'].join('\n')
    const blocks = markdownPasteToBlocks(md)

    expect(blocks.length).toBeGreaterThan(0)
    for (const block of blocks) {
      expect((block as {_key?: string})._key).toBeTruthy()
    }
  })

  it('detects a bold first column as row titles', () => {
    const md = [
      '| Metric | Value |',
      '| --- | --- |',
      '| **Revenue** | 100 |',
      '| **Costs** | 40 |',
    ].join('\n')
    const blocks = markdownPasteToBlocks(md)
    const table = blocks.find((b) => typeOf(b) === RICH_TABLE_BLOCK_TYPE) as
      | {hasRowTitles?: boolean}
      | undefined

    expect(table?.hasRowTitles).toBe(true)
  })
})
