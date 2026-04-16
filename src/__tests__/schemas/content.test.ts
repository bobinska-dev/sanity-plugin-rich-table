import {defineArrayMember} from 'sanity'
import {describe, expect, it} from 'vitest'

import content, {createContentType} from '../../schemas/content'

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

  it('block type has options configured', () => {
    const blockMember = content.of.find((member) => member.type === 'block')
    expect(blockMember?.options).toBeDefined()
    // Cast to access the oneLine property
    const options = blockMember?.options as {oneLine?: boolean} | undefined
    expect(options?.oneLine).toBe(false)
  })
})

describe('createContentType', () => {
  it('returns default content when called without args', () => {
    const result = createContentType()
    expect(result.name).toBe('content')
    expect(result).toEqual(content)
  })

  it('appends additional members after default block', () => {
    const result = createContentType([
      defineArrayMember({type: 'image', name: 'image', title: 'Image'}),
    ]) as typeof content & {of: Array<{type: string; name?: string}>}
    expect(result.name).toBe('content')
    expect(result.of.length).toBe(2)
    expect(result.of[0].type).toBe('block')
    expect(result.of[1].type).toBe('image')
  })

  it('applies block overrides to the default block member', () => {
    const result = createContentType(undefined, {
      styles: [{title: 'Normal', value: 'normal'}],
    }) as typeof content & {of: Array<{type: string; styles?: unknown[]}>}
    expect(result.name).toBe('content')
    expect(result.of.length).toBe(1)
    expect(result.of[0].type).toBe('block')
    expect(result.of[0].styles).toEqual([{title: 'Normal', value: 'normal'}])
  })

  it('combines additional members and block overrides', () => {
    const result = createContentType(
      [defineArrayMember({type: 'image', name: 'image', title: 'Image'})],
      {styles: [{title: 'Normal', value: 'normal'}]},
    ) as typeof content & {of: Array<{type: string; name?: string; styles?: unknown[]}>}
    expect(result.of.length).toBe(2)
    expect(result.of[0].type).toBe('block')
    expect(result.of[0].styles).toEqual([{title: 'Normal', value: 'normal'}])
    expect(result.of[1].type).toBe('image')
  })
})
