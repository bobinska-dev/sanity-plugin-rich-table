import {describe, expect, it} from 'vitest'

import {toRichTableValue} from '../toRichTableValue'
import type {ParsedTable} from '../types'

describe('toRichTableValue', () => {
  it('produces the correct top-level shape', () => {
    const parsed: ParsedTable = {
      headers: ['A', 'B'],
      rows: [['1', '2']],
    }

    const result = toRichTableValue(parsed)

    expect(result._type).toBe('richTable')
    expect(result._key).toBeTruthy()
    expect(result.hasColumnTitles).toBe(true)
    expect(result.hasRowTitles).toBe(false)
    expect(result.columnHeaders).toHaveLength(2)
    expect(result.rows).toHaveLength(1)
  })

  it('sets hasColumnTitles to false when no headers', () => {
    const parsed: ParsedTable = {headers: null, rows: [['a', 'b']]}
    const result = toRichTableValue(parsed)
    expect(result.hasColumnTitles).toBe(false)
  })

  it('respects ToRichTableOptions overrides', () => {
    const parsed: ParsedTable = {headers: ['Label', 'Val'], rows: [['r1', '1']]}
    const result = toRichTableValue(parsed, {hasColumnTitles: false, hasRowTitles: true})

    expect(result.hasColumnTitles).toBe(false)
    expect(result.hasRowTitles).toBe(true)
    expect(result.rows[0].title).toBe('r1')
    expect(result.columnHeaders).toHaveLength(1)
    expect(result.columnHeaders[0].title).toBe('Val')
  })

  it('generates column headers with correct cellIndex', () => {
    const parsed: ParsedTable = {headers: ['X', 'Y', 'Z'], rows: [['1', '2', '3']]}
    const result = toRichTableValue(parsed)

    result.columnHeaders.forEach((h, i) => {
      expect(h.cellIndex).toBe(i)
      expect(h._type).toBe('columnHeader')
    })

    expect(result.columnHeaders[0].title).toBe('X')
    expect(result.columnHeaders[2].title).toBe('Z')
  })

  it('every cell has a non-empty content array', () => {
    const parsed: ParsedTable = {
      headers: ['A', 'B'],
      rows: [
        ['val', ''],
        ['', '  '],
      ],
    }

    const result = toRichTableValue(parsed)

    for (const row of result.rows) {
      for (const cell of row.cells) {
        expect(cell.content).toBeDefined()
        expect(cell.content.length).toBeGreaterThanOrEqual(1)
        const firstBlock = cell.content[0] as any
        expect(firstBlock._type).toBe('block')
        expect(firstBlock.children).toBeDefined()
        expect(firstBlock.children.length).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('empty string cells get an empty block (not text block)', () => {
    const parsed: ParsedTable = {headers: null, rows: [['', 'hello']]}
    const result = toRichTableValue(parsed)

    const emptyCell = result.rows[0].cells[0].content[0] as any
    expect(emptyCell.children[0].text).toBe('')

    const textCell = result.rows[0].cells[1].content[0] as any
    expect(textCell.children[0].text).toBe('hello')
  })

  it('pads ragged rows to the maximum column count', () => {
    const parsed: ParsedTable = {
      headers: ['A', 'B', 'C'],
      rows: [['1', '2'], ['x']],
    }

    const result = toRichTableValue(parsed)

    expect(result.rows[0].cells).toHaveLength(3)
    expect(result.rows[1].cells).toHaveLength(3)

    // Padded cells should have empty block content
    const paddedCell = result.rows[1].cells[2].content[0] as any
    expect(paddedCell.children[0].text).toBe('')
  })

  it('passes through PortableTextBlock[] from HTML parser', () => {
    const ptBlock = {
      _type: 'block',
      _key: 'test-key',
      markDefs: [],
      children: [{_type: 'span', _key: 's1', text: 'Rich', marks: ['strong']}],
    }

    const parsed: ParsedTable = {
      headers: null,
      rows: [[[ptBlock] as any]],
    }

    const result = toRichTableValue(parsed)
    const cell = result.rows[0].cells[0]
    expect(cell.content).toHaveLength(1)
    expect((cell.content[0] as any)._key).toBe('test-key')
    expect((cell.content[0] as any).children[0].text).toBe('Rich')
    expect((cell.content[0] as any).children[0].marks).toContain('strong')
  })

  it('replaces empty PortableTextBlock[] array with empty block content', () => {
    const parsed: ParsedTable = {
      headers: null,
      rows: [[[] as any]],
    }

    const result = toRichTableValue(parsed)
    const cell = result.rows[0].cells[0]
    expect(cell.content).toHaveLength(1)
    expect((cell.content[0] as any).children[0].text).toBe('')
  })

  it('reads hasRowTitles from ParsedTable when options not provided', () => {
    const parsed: ParsedTable = {
      headers: ['Label', 'Value'],
      rows: [['Row A', '42']],
      hasRowTitles: true,
    }

    const result = toRichTableValue(parsed)
    expect(result.hasRowTitles).toBe(true)
    expect(result.rows[0].title).toBe('Row A')
    expect(result.columnHeaders).toHaveLength(1)
    expect(result.columnHeaders[0].title).toBe('Value')
    expect(result.rows[0].cells).toHaveLength(1)
    expect((result.rows[0].cells[0].content[0] as any).children[0].text).toBe('42')
  })

  it('options.hasRowTitles overrides ParsedTable.hasRowTitles', () => {
    const parsed: ParsedTable = {
      headers: null,
      rows: [['1', '2']],
      hasRowTitles: true,
    }

    const result = toRichTableValue(parsed, {hasRowTitles: false})
    expect(result.hasRowTitles).toBe(false)
    expect(result.rows[0].title).toBeUndefined()
    expect(result.rows[0].cells).toHaveLength(2)
  })

  it('extracts row titles from PT blocks (HTML parser output)', () => {
    const ptBlock = {
      _type: 'block',
      _key: 'k1',
      markDefs: [],
      children: [{_type: 'span', _key: 's1', text: 'Revenue', marks: ['strong']}],
    }
    const dataBlock = {
      _type: 'block',
      _key: 'k2',
      markDefs: [],
      children: [{_type: 'span', _key: 's2', text: '1000', marks: []}],
    }

    const parsed: ParsedTable = {
      headers: ['Category', 'Amount'],
      rows: [[[ptBlock] as any, [dataBlock] as any]],
      hasRowTitles: true,
    }

    const result = toRichTableValue(parsed)
    expect(result.rows[0].title).toBe('Revenue')
    expect(result.rows[0].cells).toHaveLength(1)
    expect((result.rows[0].cells[0].content[0] as any).children[0].text).toBe('1000')
  })

  it('handles hasRowTitles with no column headers', () => {
    const parsed: ParsedTable = {
      headers: null,
      rows: [
        ['Q1', '100', '200'],
        ['Q2', '300', '400'],
      ],
      hasRowTitles: true,
    }

    const result = toRichTableValue(parsed)
    expect(result.hasColumnTitles).toBe(false)
    expect(result.hasRowTitles).toBe(true)
    expect(result.rows[0].title).toBe('Q1')
    expect(result.rows[1].title).toBe('Q2')
    expect(result.rows[0].cells).toHaveLength(2)
    expect(result.columnHeaders).toHaveLength(2)
  })
})
