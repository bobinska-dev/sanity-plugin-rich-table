import {describe, expect, it} from 'vitest'

import {createEmptyBlock, createEmptyCell} from '../../utils/createEmptyCell'

describe('createEmptyBlock', () => {
  it('is a valid, fully-keyed Portable Text block', () => {
    const block = createEmptyBlock() as Record<string, unknown>

    expect(block._type).toBe('block')
    expect(typeof block._key).toBe('string')
    expect((block._key as string).length).toBeGreaterThan(0)
    expect(block.style).toBe('normal')
    expect(block.markDefs).toEqual([])
  })

  it('gives every span child a _key', () => {
    const block = createEmptyBlock() as unknown as {
      children: Array<{_type: string; _key: string; text: string; marks: string[]}>
    }

    expect(block.children).toHaveLength(1)
    const [span] = block.children
    expect(span._type).toBe('span')
    expect(typeof span._key).toBe('string')
    expect(span._key.length).toBeGreaterThan(0)
    expect(span.text).toBe('')
    expect(span.marks).toEqual([])
  })

  it('generates unique keys for the block and its span', () => {
    const block = createEmptyBlock() as unknown as {
      _key: string
      children: Array<{_key: string}>
    }

    expect(block._key).not.toBe(block.children[0]._key)
  })

  it('produces a fresh block on every call (no shared references)', () => {
    const a = createEmptyBlock()
    const b = createEmptyBlock()

    expect(a).not.toBe(b)
    expect(a._key).not.toBe(b._key)
  })
})

describe('createEmptyCell', () => {
  it('creates a keyed richTableCell wrapping a single keyed block', () => {
    const cell = createEmptyCell()

    expect(cell._type).toBe('richTableCell')
    expect(typeof cell._key).toBe('string')
    expect(cell._key.length).toBeGreaterThan(0)
    expect(cell.content).toHaveLength(1)

    const block = cell.content[0] as Record<string, unknown>
    expect(block._type).toBe('block')
    expect(typeof block._key).toBe('string')
  })

  it('produces distinct keys across cells', () => {
    const a = createEmptyCell()
    const b = createEmptyCell()

    expect(a._key).not.toBe(b._key)
    expect(a).not.toBe(b)
  })
})
