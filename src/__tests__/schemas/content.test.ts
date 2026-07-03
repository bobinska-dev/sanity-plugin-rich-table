import {describe, expect, it} from 'vitest'

import content from '../../schemas/content'

describe('content schema', () => {
  it('has correct name', () => {
    expect(content.name).toBe('content')
  })

  it('has correct title', () => {
    expect(content.title).toBe('Rich table content')
  })

  it('is an array type', () => {
    expect(content.type).toBe('array')
  })

  it('has array members defined', () => {
    expect(content.of).toBeDefined()
    expect(Array.isArray(content.of)).toBe(true)
    expect(content.of.length).toBeGreaterThan(0)
  })

  it('includes block type in array members', () => {
    const blockMember = content.of.find((member) => member.type === 'block')
    expect(blockMember).toBeDefined()
  })

  it('block type allows multi-line content (no oneLine restriction)', () => {
    const blockMember = content.of.find((member) => member.type === 'block')
    // The default `content` block member intentionally does not set `oneLine`,
    // since `oneLine: false` is already the default — table cells allow multi-line content.
    const options = blockMember?.options as {oneLine?: boolean} | undefined
    expect(options?.oneLine).not.toBe(true)
  })
})
