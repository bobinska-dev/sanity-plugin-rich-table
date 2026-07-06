import {keyGenerator} from '@portabletext/editor'
import {describe, expect, it} from 'vitest'

describe('keyGenerator (from @portabletext/editor)', () => {
  it('returns a non-empty string', () => {
    const key = keyGenerator()
    expect(typeof key).toBe('string')
    expect(key.length).toBeGreaterThan(0)
  })

  it('generates unique keys across calls', () => {
    const keys = new Set(Array.from({length: 100}, () => keyGenerator()))
    expect(keys.size).toBe(100)
  })
})
