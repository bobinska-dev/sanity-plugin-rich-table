import {describe, expect, it} from 'vitest'

import {parseTsvTable} from '../parseTsvTable'
import {MAX_IMPORT_ROWS} from '../types'

describe('parseTsvTable', () => {
  it('parses a basic 2-column TSV with header', () => {
    const tsv = 'Name\tAge\nAlice\t30\nBob\t25'
    const result = parseTsvTable(tsv)

    expect(result.table.headers).toEqual(['Name', 'Age'])
    expect(result.table.rows).toEqual([
      ['Alice', '30'],
      ['Bob', '25'],
    ])
    expect(result.warnings).toEqual([])
  })

  it('treats single-row TSV as headerless', () => {
    const tsv = 'Alice\t30'
    const result = parseTsvTable(tsv)

    expect(result.table.headers).toBeNull()
    expect(result.table.rows).toEqual([['Alice', '30']])
  })

  it('handles empty input', () => {
    const result = parseTsvTable('')
    expect(result.table.headers).toBeNull()
    expect(result.table.rows).toEqual([])
  })

  it('handles cells with empty values', () => {
    const tsv = 'A\tB\nfoo\t\n\tbar'
    const result = parseTsvTable(tsv)

    expect(result.table.headers).toEqual(['A', 'B'])
    expect(result.table.rows).toEqual([
      ['foo', ''],
      ['', 'bar'],
    ])
  })

  it('handles Windows-style CRLF line endings', () => {
    const tsv = 'X\tY\r\n1\t2\r\n3\t4'
    const result = parseTsvTable(tsv)

    expect(result.table.headers).toEqual(['X', 'Y'])
    expect(result.table.rows).toHaveLength(2)
  })

  it('truncates rows beyond MAX_IMPORT_ROWS and sets totalRows', () => {
    const header = 'Col1\tCol2'
    const dataRows = Array.from({length: MAX_IMPORT_ROWS + 50}, (_, i) => `val${i}\tval${i}`).join(
      '\n',
    )
    const tsv = `${header}\n${dataRows}`

    const result = parseTsvTable(tsv)
    expect(result.table.rows).toHaveLength(MAX_IMPORT_ROWS)
    expect(result.totalRows).toBe(MAX_IMPORT_ROWS + 50)
  })

  it('does NOT set totalRows when rows are within limit', () => {
    const tsv = 'A\tB\n1\t2\n3\t4'
    const result = parseTsvTable(tsv)
    expect(result.totalRows).toBeUndefined()
  })

  it('handles ragged rows (different column counts)', () => {
    const tsv = 'A\tB\tC\n1\t2\t3\n4\t5'
    const result = parseTsvTable(tsv)

    expect(result.table.headers).toEqual(['A', 'B', 'C'])
    expect(result.table.rows[0]).toEqual(['1', '2', '3'])
    expect(result.table.rows[1]).toEqual(['4', '5'])
  })
})
