import {describe, expect, it} from 'vitest'
import * as XLSX from 'xlsx'

import {parseFile} from '../parseFile'
import type {XlsxParseResult} from '../types'

function createFile(name: string, content: string | ArrayBuffer): File {
  const blob =
    content instanceof ArrayBuffer
      ? new Blob([content], {type: 'application/octet-stream'})
      : new Blob([content], {type: 'text/plain'})
  return new File([blob], name)
}

function createXlsxBuffer(data: string[][]): ArrayBuffer {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(data)
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  return XLSX.write(wb, {type: 'array', bookType: 'xlsx'})
}

describe('parseFile', () => {
  it('parses a .csv file', async () => {
    const file = createFile('data.csv', 'Name,Age\nAlice,30\nBob,25')
    const result = await parseFile(file)
    expect(result).not.toBeNull()
    expect(result!.table.headers).toEqual(['Name', 'Age'])
    expect(result!.table.rows).toEqual([
      ['Alice', '30'],
      ['Bob', '25'],
    ])
  })

  it('parses a .tsv file', async () => {
    const file = createFile('data.tsv', 'Name\tAge\nAlice\t30\nBob\t25')
    const result = await parseFile(file)
    expect(result).not.toBeNull()
    expect(result!.table.headers).toEqual(['Name', 'Age'])
    expect(result!.table.rows).toEqual([
      ['Alice', '30'],
      ['Bob', '25'],
    ])
  })

  it('parses a .xlsx file', async () => {
    const buf = createXlsxBuffer([
      ['Name', 'Age'],
      ['Alice', '30'],
    ])
    const file = createFile('data.xlsx', buf)
    const result = await parseFile(file)
    expect(result).not.toBeNull()
    expect(result!.table.rows.length).toBeGreaterThanOrEqual(1)
    expect((result as XlsxParseResult).sheetNames).toEqual(['Sheet1'])
  })

  it('returns null for unsupported file extensions', async () => {
    const file = createFile('data.json', '{"a":1}')
    const result = await parseFile(file)
    expect(result).toBeNull()
  })

  it('returns null for files without an extension', async () => {
    const file = createFile('data', 'some content')
    const result = await parseFile(file)
    expect(result).toBeNull()
  })

  it('passes xlsxSheetName through to the parser', async () => {
    const wb = XLSX.utils.book_new()
    const ws1 = XLSX.utils.aoa_to_sheet([['A'], ['1']])
    const ws2 = XLSX.utils.aoa_to_sheet([['B'], ['2']])
    XLSX.utils.book_append_sheet(wb, ws1, 'First')
    XLSX.utils.book_append_sheet(wb, ws2, 'Second')
    const buf: ArrayBuffer = XLSX.write(wb, {type: 'array', bookType: 'xlsx'})

    const file = createFile('multi.xlsx', buf)
    const result = (await parseFile(file, 'Second')) as XlsxParseResult
    expect(result.sheetNames).toEqual(['First', 'Second'])
    expect(result.table.rows).toHaveLength(2)
  })
})
