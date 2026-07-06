import {describe, expect, it} from 'vitest'

import {
  createEmptyBlockContent,
  createPlaceholderBlock,
  createTextBlock,
  PLACEHOLDER_PREFIX,
} from '../placeholders'

describe('placeholders', () => {
  describe('createEmptyBlockContent', () => {
    it('returns an array with one block', () => {
      const content = createEmptyBlockContent()
      expect(content).toHaveLength(1)
    })

    it("the block has type 'block' and an empty span", () => {
      const block = createEmptyBlockContent()[0] as any
      expect(block._type).toBe('block')
      expect(block.children).toHaveLength(1)
      expect(block.children[0]._type).toBe('span')
      expect(block.children[0].text).toBe('')
    })

    it('generates unique keys on each call', () => {
      const a = createEmptyBlockContent()[0] as any
      const b = createEmptyBlockContent()[0] as any
      expect(a._key).not.toBe(b._key)
    })
  })

  describe('createPlaceholderBlock', () => {
    it('includes the reason in the text', () => {
      const block = createPlaceholderBlock('image') as any
      expect(block.children[0].text).toContain('image')
    })

    it('starts with the warning emoji prefix', () => {
      const block = createPlaceholderBlock('formula') as any
      expect(block.children[0].text.startsWith(PLACEHOLDER_PREFIX)).toBe(true)
    })

    it('uses the code decorator', () => {
      const block = createPlaceholderBlock('test') as any
      expect(block.children[0].marks).toContain('code')
    })
  })

  describe('createTextBlock', () => {
    it('wraps text in a block with a span', () => {
      const block = createTextBlock('Hello') as any
      expect(block._type).toBe('block')
      expect(block.children[0].text).toBe('Hello')
      expect(block.children[0].marks).toEqual([])
    })
  })
})
