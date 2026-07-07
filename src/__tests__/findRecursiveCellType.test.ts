import {describe, expect, it} from 'vitest'

import {findRecursiveCellType} from '../portable-text/findRecursiveCellType'

/** Minimal stand-in for Sanity's compiled schema registry. */
const schemaWith = (typeName: string, arrayType: unknown) => ({
  get: (name: string) => (name === typeName ? arrayType : undefined),
})

// A compiled block member (`{type: 'block'}` → block → object), never a table.
const blockMember = {name: 'block', type: {name: 'block', type: {name: 'object'}}}
// A compiled `richTableBlock` member inherits from `richTable`.
const richTableBlockMember = {
  name: 'richTableBlock',
  type: {name: 'richTable', type: {name: 'object'}},
}

describe('findRecursiveCellType', () => {
  it('returns undefined when no type name is given', () => {
    expect(findRecursiveCellType(schemaWith('x', {of: []}), undefined)).toBeUndefined()
  })

  it('returns undefined when the type is not registered', () => {
    expect(findRecursiveCellType(schemaWith('other', {of: []}), 'tableCellContent')).toBeUndefined()
  })

  it('returns undefined for a normal Portable Text cell schema', () => {
    const schema = schemaWith('tableCellContent', {of: [blockMember]})
    expect(findRecursiveCellType(schema, 'tableCellContent')).toBeUndefined()
  })

  it('flags a richTableBlock member by name', () => {
    const schema = schemaWith('tableCellContent', {of: [blockMember, richTableBlockMember]})
    expect(findRecursiveCellType(schema, 'tableCellContent')).toBe('richTableBlock')
  })

  it('flags a custom-named block that inherits from richTable', () => {
    const custom = {name: 'nestedTable', type: {name: 'richTable', type: {name: 'object'}}}
    const schema = schemaWith('tableCellContent', {of: [custom]})
    expect(findRecursiveCellType(schema, 'tableCellContent')).toBe('nestedTable')
  })

  it('flags a bare richTable member (falls back to the type name)', () => {
    const bare = {type: {name: 'richTable'}}
    const schema = schemaWith('tableCellContent', {of: [bare]})
    expect(findRecursiveCellType(schema, 'tableCellContent')).toBe('richTable')
  })

  it('flags an INDIRECT cycle — a table nested inside a custom block object', () => {
    // A `callout` cell member whose own body PT array embeds a richTableBlock.
    const callout = {
      name: 'callout',
      type: {name: 'object'},
      fields: [
        {name: 'title', type: {name: 'string'}},
        {name: 'body', type: {name: 'array', of: [blockMember, richTableBlockMember]}},
      ],
    }
    const schema = schemaWith('tableCellContent', {of: [blockMember, callout]})
    // Reports the top-level cell member that introduces the cycle.
    expect(findRecursiveCellType(schema, 'tableCellContent')).toBe('callout')
  })

  it('does not loop forever on a self-referential compiled chain', () => {
    const cyclic: {name: string; type?: unknown; fields?: unknown} = {name: 'block'}
    cyclic.type = cyclic
    cyclic.fields = [{type: cyclic}]
    const schema = schemaWith('tableCellContent', {of: [cyclic]})
    expect(() => findRecursiveCellType(schema, 'tableCellContent')).not.toThrow()
    expect(findRecursiveCellType(schema, 'tableCellContent')).toBeUndefined()
  })
})
