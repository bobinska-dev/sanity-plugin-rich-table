import {describe, expect, it} from 'vitest'

import {resolveCellContentSchemaType} from '../../portable-text/resolveCellContentSchemaType'

describe('resolveCellContentSchemaType', () => {
  const members = [{name: 'block'}]

  it('unwraps a field descriptor to the array type carrying `of`', () => {
    // The shape Table passes as `props.schemaType`: the cell's `content` field.
    const field = {name: 'content', type: {name: 'richTableCellContent', of: members}}
    expect(resolveCellContentSchemaType(field)?.name).toBe('richTableCellContent')
  })

  it('returns an array type given directly', () => {
    const arrayType = {name: 'content', of: members}
    expect(resolveCellContentSchemaType(arrayType)?.name).toBe('content')
  })

  it('walks a deeper wrapper to the first node with `of`', () => {
    const deep = {name: 'a', type: {name: 'b', type: {name: 'richTableCellContent', of: members}}}
    expect(resolveCellContentSchemaType(deep)?.name).toBe('richTableCellContent')
  })

  it('returns undefined when nothing in the chain has `of`', () => {
    expect(resolveCellContentSchemaType({name: 'x', type: {name: 'string'}})).toBeUndefined()
    expect(resolveCellContentSchemaType(undefined)).toBeUndefined()
  })

  it('does not loop forever on a self-referential chain', () => {
    const cyclic: {name: string; type?: unknown} = {name: 'loop'}
    cyclic.type = cyclic
    expect(() => resolveCellContentSchemaType(cyclic)).not.toThrow()
    expect(resolveCellContentSchemaType(cyclic)).toBeUndefined()
  })
})
