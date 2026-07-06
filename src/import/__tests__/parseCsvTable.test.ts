import {describe, expect, it} from 'vitest'

import {parseCsvTable} from '../parseCsvTable'
import {MAX_IMPORT_ROWS} from '../types'

describe('parseCsvTable', () => {
  it('parses a basic CSV', () => {
    const csv = 'Name,Age\nAlice,30\nBob,25'
    const result = parseCsvTable(csv)

    expect(result.table.headers).toEqual(['Name', 'Age'])
    expect(result.table.rows).toEqual([
      ['Alice', '30'],
      ['Bob', '25'],
    ])
  })

  it('handles quoted fields with commas', () => {
    const csv = 'Name,Description\nAlice,"Likes cats, dogs"\nBob,"Works at Acme, Inc."'
    const result = parseCsvTable(csv)

    expect(result.table.rows[0]).toEqual(['Alice', 'Likes cats, dogs'])
    expect(result.table.rows[1]).toEqual(['Bob', 'Works at Acme, Inc.'])
  })

  it('handles escaped double-quotes inside quoted fields', () => {
    const csv = 'Name,Quote\nAlice,"She said ""hello"""\nBob,"A ""test"""'
    const result = parseCsvTable(csv)

    expect(result.table.rows[0]).toEqual(['Alice', 'She said "hello"'])
    expect(result.table.rows[1]).toEqual(['Bob', 'A "test"'])
  })

  it('handles newlines inside quoted fields', () => {
    const csv = 'Name,Bio\nAlice,"Line 1\nLine 2"\nBob,Simple'
    const result = parseCsvTable(csv)

    expect(result.table.rows[0]).toEqual(['Alice', 'Line 1\nLine 2'])
    expect(result.table.rows[1]).toEqual(['Bob', 'Simple'])
  })

  it('handles CRLF line endings', () => {
    const csv = 'A,B\r\n1,2\r\n3,4'
    const result = parseCsvTable(csv)

    expect(result.table.headers).toEqual(['A', 'B'])
    expect(result.table.rows).toHaveLength(2)
  })

  it('handles empty input', () => {
    const result = parseCsvTable('')
    expect(result.table.headers).toBeNull()
    expect(result.table.rows).toEqual([])
  })

  it('handles single row as headerless', () => {
    const csv = 'foo,bar'
    const result = parseCsvTable(csv)

    expect(result.table.headers).toBeNull()
    expect(result.table.rows).toEqual([['foo', 'bar']])
  })

  it('truncates data rows beyond MAX_IMPORT_ROWS and sets totalRows', () => {
    const header = 'Col1,Col2'
    const dataRows = Array.from({length: MAX_IMPORT_ROWS + 50}, (_, i) => `a${i},b${i}`).join('\n')
    const csv = `${header}\n${dataRows}`

    const result = parseCsvTable(csv)
    expect(result.table.headers).toEqual(['Col1', 'Col2'])
    expect(result.table.rows).toHaveLength(MAX_IMPORT_ROWS)
    expect(result.totalRows).toBe(MAX_IMPORT_ROWS + 50)
  })

  it('does NOT set totalRows when rows are within limit', () => {
    const csv = 'A,B\n1,2\n3,4'
    const result = parseCsvTable(csv)
    expect(result.totalRows).toBeUndefined()
  })

  it('handles ragged rows (different column counts)', () => {
    const csv = 'A,B,C\n1,2,3\n4,5'
    const result = parseCsvTable(csv)

    expect(result.table.headers).toEqual(['A', 'B', 'C'])
    expect(result.table.rows[0]).toEqual(['1', '2', '3'])
    expect(result.table.rows[1]).toEqual(['4', '5'])
  })
})
