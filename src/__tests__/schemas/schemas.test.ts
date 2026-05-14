import {describe, expect, it} from 'vitest'

import cellObject from '../../schemas/cell.object'
import columnHeaderObject from '../../schemas/columnHeader.object'
import richTableObject from '../../schemas/richTable.object'
import rowObject from '../../schemas/row.object'

describe('richTableObject schema', () => {
  it('has correct name', () => {
    expect(richTableObject.name).toBe('richTable')
  })

  it('has correct type', () => {
    expect(richTableObject.type).toBe('object')
  })

  it('has rows field', () => {
    const rowsField = richTableObject.fields.find((f) => f.name === 'rows')
    expect(rowsField).toBeDefined()
    expect(rowsField?.type).toBe('array')
  })

  it('has columnHeaders field', () => {
    const columnHeadersField = richTableObject.fields.find((f) => f.name === 'columnHeaders')
    expect(columnHeadersField).toBeDefined()
    expect(columnHeadersField?.type).toBe('array')
  })

  it('has hasColumnTitles field', () => {
    const field = richTableObject.fields.find((f) => f.name === 'hasColumnTitles')
    expect(field).toBeDefined()
    expect(field?.type).toBe('boolean')
  })

  it('has hasRowTitles field', () => {
    const field = richTableObject.fields.find((f) => f.name === 'hasRowTitles')
    expect(field).toBeDefined()
    expect(field?.type).toBe('boolean')
  })

  it('has icon defined', () => {
    expect(richTableObject.icon).toBeDefined()
  })

  it('has input component defined', () => {
    expect(richTableObject.components?.input).toBeDefined()
  })

  it('has block component defined', () => {
    expect(richTableObject.components?.block).toBeDefined()
  })
})

describe('rowObject schema', () => {
  it('has correct name', () => {
    expect(rowObject.name).toBe('richTableRow')
  })

  it('has correct type', () => {
    expect(rowObject.type).toBe('object')
  })

  it('has title field', () => {
    const titleField = rowObject.fields.find((f) => f.name === 'title')
    expect(titleField).toBeDefined()
    expect(titleField?.type).toBe('string')
  })

  it('has cells field', () => {
    const cellsField = rowObject.fields.find((f) => f.name === 'cells')
    expect(cellsField).toBeDefined()
    expect(cellsField?.type).toBe('array')
  })

  it('has preview configuration', () => {
    expect(rowObject.preview).toBeDefined()
    expect(rowObject.preview?.select).toBeDefined()
    expect(rowObject.preview?.prepare).toBeDefined()
  })
})

describe('cellObject schema', () => {
  it('has correct name', () => {
    expect(cellObject.name).toBe('richTableCell')
  })

  it('has correct type', () => {
    expect(cellObject.type).toBe('object')
  })

  it('has content field', () => {
    const contentField = cellObject.fields.find((f) => f.name === 'content')
    expect(contentField).toBeDefined()
    expect(contentField?.type).toBe('array')
  })
})

describe('columnHeaderObject schema', () => {
  it('has correct name', () => {
    expect(columnHeaderObject.name).toBe('columnHeader')
  })

  it('has correct type', () => {
    expect(columnHeaderObject.type).toBe('object')
  })

  it('has title field', () => {
    const titleField = columnHeaderObject.fields.find((f) => f.name === 'title')
    expect(titleField).toBeDefined()
    expect(titleField?.type).toBe('string')
  })

  it('has cellIndex field', () => {
    const cellIndexField = columnHeaderObject.fields.find((f) => f.name === 'cellIndex')
    expect(cellIndexField).toBeDefined()
    expect(cellIndexField?.type).toBe('number')
  })

  it('has preview configuration', () => {
    expect(columnHeaderObject.preview).toBeDefined()
  })
})

describe('Row preview', () => {
  const prepare = rowObject.preview?.prepare

  it('returns default title when no title provided', () => {
    if (!prepare) return
    const result = prepare({title: undefined, cells: [{}, {}]})
    expect(result.title).toBe('Row')
    expect(result.subtitle).toBe('2 cells')
  })

  it('returns custom title when provided', () => {
    if (!prepare) return
    const result = prepare({title: 'My Row', cells: [{}, {}, {}]})
    expect(result.title).toBe('My Row')
    expect(result.subtitle).toBe('3 cells')
  })

  it('handles singular cell correctly', () => {
    if (!prepare) return
    const result = prepare({title: undefined, cells: [{}]})
    expect(result.subtitle).toBe('1 cell')
  })
})
