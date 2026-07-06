import {describe, expect, it} from 'vitest'

import {hasInlineChanges, type InlineDiffSegment, inlineTextDiff} from '../utils/inlineTextDiff'

/** Compact view of a diff: e.g. `-TEST +YIKES =\n[image]` for readable assertions. */
function sketch(segments: InlineDiffSegment[]): string {
  const glyph = {added: '+', removed: '-', unchanged: '='} as const
  return segments.map((s) => `${glyph[s.status]}${s.value}`).join(' ')
}

/** Joining only the non-removed segments must reproduce `to`. */
function reconstructTo(segments: InlineDiffSegment[]): string {
  return segments
    .filter((s) => s.status !== 'removed')
    .map((s) => s.value)
    .join('')
}

/** Joining only the non-added segments must reproduce `from`. */
function reconstructFrom(segments: InlineDiffSegment[]): string {
  return segments
    .filter((s) => s.status !== 'added')
    .map((s) => s.value)
    .join('')
}

describe('inlineTextDiff', () => {
  it('returns nothing for two empty strings', () => {
    expect(inlineTextDiff('', '')).toEqual([])
  })

  it('returns a single unchanged segment for identical strings', () => {
    expect(inlineTextDiff('hello world', 'hello world')).toEqual([
      {value: 'hello world', status: 'unchanged'},
    ])
  })

  it('marks a replaced first word as removed then added, keeping the rest unchanged', () => {
    // Mirrors the cell screenshot: TEST → YIKES with [image]/[customBlock] untouched.
    const segments = inlineTextDiff('TEST\n[image]\n[customBlock]', 'YIKES\n[image]\n[customBlock]')
    expect(sketch(segments)).toBe('-TEST +YIKES =\n[image]\n[customBlock]')
  })

  it('treats a pure addition as one added segment', () => {
    expect(inlineTextDiff('', 'new text')).toEqual([{value: 'new text', status: 'added'}])
  })

  it('treats a pure removal as one removed segment', () => {
    expect(inlineTextDiff('gone text', '')).toEqual([{value: 'gone text', status: 'removed'}])
  })

  it('detects a word appended to the end', () => {
    const segments = inlineTextDiff('one two', 'one two three')
    // The added run carries its leading space (the space before "three" is new).
    expect(sketch(segments)).toBe('=one two + three')
  })

  it('deletes a whole middle word, aligned to the word boundary (not mid-word)', () => {
    const segments = inlineTextDiff('one two three', 'one three')
    // The edit is slid to "two " rather than the raw char-diff "wo t".
    expect(segments).toEqual([
      {value: 'one ', status: 'unchanged'},
      {value: 'two ', status: 'removed'},
      {value: 'three', status: 'unchanged'},
    ])
  })

  it('highlights only the changed characters within a single token', () => {
    // The original complaint: "hherr" is common, only "wrwr" is new.
    expect(inlineTextDiff('hherr', 'hherrwrwr')).toEqual([
      {value: 'hherr', status: 'unchanged'},
      {value: 'wrwr', status: 'added'},
    ])
    // A one-character insertion mid-token (test → testr).
    expect(inlineTextDiff('test', 'testr')).toEqual([
      {value: 'test', status: 'unchanged'},
      {value: 'r', status: 'added'},
    ])
  })

  it('marks the whole differing middle when a token is replaced (no shared edges)', () => {
    // No common prefix/suffix → the middle is a straight remove + add.
    expect(inlineTextDiff('a b c', 'x y z')).toEqual([
      {value: 'a b c', status: 'removed'},
      {value: 'x y z', status: 'added'},
    ])
  })

  it('merges consecutive removed tokens (no shared anchors) into one segment', () => {
    const segments = inlineTextDiff('alpha beta gamma', 'alpha')
    expect(segments).toEqual([
      {value: 'alpha', status: 'unchanged'},
      {value: ' beta gamma', status: 'removed'},
    ])
  })

  it('always reconstructs both sides for arbitrary edits', () => {
    const from = 'The quick brown fox jumps'
    const to = 'The slow brown cat jumps high'
    const segments = inlineTextDiff(from, to)
    expect(reconstructFrom(segments)).toBe(from)
    expect(reconstructTo(segments)).toBe(to)
  })

  it('handles large inputs (prefix/suffix scan is linear, no quadratic blowup)', () => {
    const from = Array.from({length: 5000}, (_, i) => `a${i}`).join(' ')
    const to = `${from} extra`
    const segments = inlineTextDiff(from, to)
    expect(reconstructFrom(segments)).toBe(from)
    expect(reconstructTo(segments)).toBe(to)
    expect(segments.some((s) => s.status === 'added' && s.value.includes('extra'))).toBe(true)
  })

  it('handles a leading insertion', () => {
    expect(inlineTextDiff('world', 'hello world')).toEqual([
      {value: 'hello ', status: 'added'},
      {value: 'world', status: 'unchanged'},
    ])
  })

  it('marks a single changed character inside a word', () => {
    expect(inlineTextDiff('gray', 'grey')).toEqual([
      {value: 'gr', status: 'unchanged'},
      {value: 'a', status: 'removed'},
      {value: 'e', status: 'added'},
      {value: 'y', status: 'unchanged'},
    ])
  })
})

describe('hasInlineChanges', () => {
  it('is false when everything is unchanged', () => {
    expect(hasInlineChanges(inlineTextDiff('same', 'same'))).toBe(false)
  })

  it('is true when there is any add or remove', () => {
    expect(hasInlineChanges(inlineTextDiff('a', 'b'))).toBe(true)
  })
})
