import {describe, expect, it} from 'vitest'

import {schemaHasNestedRichTable} from '../schemaHasNestedRichTable'

/** Minimal compiled-schema stand-in: name→node lookup + the type-name list. */
function makeSchema(types: Record<string, unknown>) {
  return {
    getTypeNames: () => Object.keys(types),
    get: (name: string) => types[name],
  }
}

const block = {name: 'block', type: {name: 'block'}}
const image = {name: 'image', type: {name: 'image'}}
// `richTableBlock` is `type: 'richTable'`, so its chain reaches `richTable`.
const richTableBlockMember = {
  name: 'richTableBlock',
  type: {name: 'richTable', type: {name: 'object'}},
}

describe('schemaHasNestedRichTable', () => {
  it('is true when a Portable Text field has a rich table among its members', () => {
    const body = {name: 'body', of: [block, richTableBlockMember]}
    const article = {
      name: 'article',
      type: {name: 'document'},
      fields: [{name: 'body', type: body}],
    }
    expect(schemaHasNestedRichTable(makeSchema({article}))).toBe(true)
  })

  it('is true for INDIRECT nesting (a block object in a PT field whose own PT field holds a table)', () => {
    const inner = {name: 'inner', of: [block, richTableBlockMember]}
    const callout = {
      name: 'callout',
      type: {name: 'object'},
      fields: [{name: 'inner', type: inner}],
    }
    const body = {name: 'body', of: [block, callout]}
    const doc = {name: 'doc', type: {name: 'document'}, fields: [{name: 'body', type: body}]}
    expect(schemaHasNestedRichTable(makeSchema({doc}))).toBe(true)
  })

  it('is false for a standalone rich table field (cells are editors, but not nested in another editor)', () => {
    // A richTable used directly as a field — its own cell content is a PT array
    // but contains no table, so there is no editor-in-editor nesting.
    const cellContent = {name: 'content', of: [block, image]}
    const richTable = {
      name: 'richTable',
      type: {name: 'object'},
      fields: [{name: 'content', type: cellContent}],
    }
    const page = {name: 'page', type: {name: 'document'}, fields: [{name: 'tbl', type: richTable}]}
    expect(schemaHasNestedRichTable(makeSchema({page, richTable}))).toBe(false)
  })

  it('is false for a Portable Text field with no rich table', () => {
    const body = {name: 'body', of: [block, image]}
    const article = {
      name: 'article',
      type: {name: 'document'},
      fields: [{name: 'body', type: body}],
    }
    expect(schemaHasNestedRichTable(makeSchema({article}))).toBe(false)
  })

  it('is false for an empty schema or one without getTypeNames', () => {
    expect(schemaHasNestedRichTable(makeSchema({}))).toBe(false)
    expect(schemaHasNestedRichTable({get: () => undefined})).toBe(false)
  })
})
