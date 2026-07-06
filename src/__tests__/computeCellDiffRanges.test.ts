import {describe, expect, it} from 'vitest'

import {
  computeCellDiffRanges,
  rangeToSelection,
} from '../portable-text/inline-diff/computeCellDiffRanges'

function block(key: string, text: string) {
  return {_type: 'block', _key: key, children: [{_type: 'span', _key: `${key}-s`, text}]}
}

function image(key: string) {
  return {_type: 'image', _key: key, asset: {_ref: 'img'}}
}

describe('computeCellDiffRanges', () => {
  it('returns nothing when the content is identical', () => {
    const value = [block('b1', 'hello')]
    expect(computeCellDiffRanges(value, value)).toEqual([])
  })

  it('marks a replaced word: removed at the edit point, added over the new text', () => {
    // "TEST" -> "YIKES" in the same block (the screenshot case).
    const ranges = computeCellDiffRanges([block('b1', 'TEST')], [block('b1', 'YIKES')])
    expect(ranges).toEqual([
      {blockKey: 'b1', type: 'removed', start: 0, end: 0, text: 'TEST'},
      {blockKey: 'b1', type: 'added', start: 0, end: 5, text: ''},
    ])
  })

  it('marks appended text as added at the end of the block', () => {
    const ranges = computeCellDiffRanges([block('b1', 'hello')], [block('b1', 'hello world')])
    expect(ranges).toEqual([{blockKey: 'b1', type: 'added', start: 5, end: 11, text: ''}])
  })

  it('marks deleted text as a collapsed removed range carrying the text', () => {
    const ranges = computeCellDiffRanges([block('b1', 'hello world')], [block('b1', 'hello')])
    expect(ranges).toEqual([{blockKey: 'b1', type: 'removed', start: 5, end: 5, text: ' world'}])
  })

  it('treats a brand-new text block as fully added', () => {
    const ranges = computeCellDiffRanges([], [block('b1', 'new')])
    expect(ranges).toEqual([{blockKey: 'b1', type: 'added', start: 0, end: 3, text: ''}])
  })

  it('ignores non-text blocks (images, custom blocks)', () => {
    const ranges = computeCellDiffRanges([image('i1')], [image('i1')])
    expect(ranges).toEqual([])
  })

  it('only decorates the changed block, leaving sibling text blocks alone', () => {
    const before = [block('b1', 'one'), block('b2', 'two')]
    const current = [block('b1', 'one'), block('b2', 'TWO')]
    const ranges = computeCellDiffRanges(before, current)
    expect(ranges.every((r) => r.blockKey === 'b2')).toBe(true)
    expect(ranges.some((r) => r.type === 'added')).toBe(true)
  })

  it('never throws on malformed input', () => {
    expect(() => computeCellDiffRanges(null, undefined)).not.toThrow()
    expect(() => computeCellDiffRanges('nope', {rows: 1})).not.toThrow()
    expect(computeCellDiffRanges(null, undefined)).toEqual([])
  })

  it('keeps offsets in current-value coordinates across mixed edits', () => {
    // "the quick fox" -> "the slow brown fox": "quick" replaced, "brown " inserted.
    const ranges = computeCellDiffRanges(
      [block('b1', 'the quick fox')],
      [block('b1', 'the slow brown fox')],
    )
    // Every added range must index into the current text; removed ranges are collapsed.
    const currentText = 'the slow brown fox'
    for (const range of ranges) {
      expect(range.start).toBeGreaterThanOrEqual(0)
      expect(range.end).toBeLessThanOrEqual(currentText.length)
      if (range.type === 'removed') expect(range.start).toBe(range.end)
      else expect(range.end).toBeGreaterThan(range.start)
    }
  })
})

describe('rangeToSelection', () => {
  const current = [block('b1', 'YIKES')]

  it('maps an added range to a span selection with block-relative offsets', () => {
    const selection = rangeToSelection(
      {blockKey: 'b1', type: 'added', start: 0, end: 5, text: ''},
      current,
    )
    expect(selection).toEqual({
      anchor: {path: [{_key: 'b1'}, 'children', {_key: 'b1-s'}], offset: 0},
      focus: {path: [{_key: 'b1'}, 'children', {_key: 'b1-s'}], offset: 5},
    })
  })

  it('maps a collapsed removed range to an equal anchor/focus point', () => {
    const selection = rangeToSelection(
      {blockKey: 'b1', type: 'removed', start: 5, end: 5, text: 'TEST'},
      current,
    )
    expect(selection?.anchor).toEqual(selection?.focus)
    expect(selection?.anchor.offset).toBe(5)
  })

  it('resolves offsets across multiple spans in a block', () => {
    const multi = [
      {
        _type: 'block',
        _key: 'b1',
        children: [
          {_type: 'span', _key: 's1', text: 'foo'},
          {_type: 'span', _key: 's2', text: 'bar'},
        ],
      },
    ]
    // Offset 4 falls in the second span ("bar"), 1 char in.
    const selection = rangeToSelection(
      {blockKey: 'b1', type: 'added', start: 4, end: 6, text: ''},
      multi,
    )
    expect(selection?.anchor).toEqual({path: [{_key: 'b1'}, 'children', {_key: 's2'}], offset: 1})
    expect(selection?.focus).toEqual({path: [{_key: 'b1'}, 'children', {_key: 's2'}], offset: 3})
  })

  it('returns null when the target block is absent or not a text block', () => {
    expect(
      rangeToSelection({blockKey: 'nope', type: 'added', start: 0, end: 1, text: ''}, current),
    ).toBeNull()
    expect(
      rangeToSelection({blockKey: 'i1', type: 'added', start: 0, end: 1, text: ''}, [image('i1')]),
    ).toBeNull()
  })
})
