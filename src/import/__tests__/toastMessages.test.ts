import {describe, expect, it} from 'vitest'

import {getToastForResult} from '../toastMessages'
import {MAX_IMPORT_ROWS, type ParseResult} from '../types'

describe('getToastForResult', () => {
  it('returns error toast when result is null (format not detected)', () => {
    const toast = getToastForResult(null)
    expect(toast.status).toBe('error')
    expect(toast.title).toBe('Could not detect table data')
  })

  it('returns error toast when parse produced no rows', () => {
    const result: ParseResult = {table: {headers: null, rows: []}, warnings: []}
    const toast = getToastForResult(result)
    expect(toast.status).toBe('error')
    expect(toast.title).toBe('Table import failed')
  })

  it('returns warning toast when row limit was exceeded', () => {
    const result: ParseResult = {
      table: {headers: ['A'], rows: [['1']]},
      warnings: [],
    }
    const toast = getToastForResult(result, 500)
    expect(toast.status).toBe('warning')
    expect(toast.title).toBe('Table truncated')
    expect(toast.description).toContain('500')
    expect(toast.description).toContain(String(MAX_IMPORT_ROWS))
  })

  it('returns warning toast when there are cell warnings', () => {
    const result: ParseResult = {
      table: {headers: ['A'], rows: [['1'], ['2']]},
      warnings: [
        {row: 0, col: 0, reason: 'image'},
        {row: 1, col: 0, reason: 'formula'},
      ],
    }
    const toast = getToastForResult(result)
    expect(toast.status).toBe('warning')
    expect(toast.title).toBe('Table imported with warnings')
    expect(toast.description).toContain('2 cell(s)')
  })

  it('returns success toast for clean import with rich format', () => {
    const result: ParseResult = {
      table: {
        headers: ['A', 'B'],
        rows: [
          ['1', '2'],
          ['3', '4'],
        ],
      },
      warnings: [],
    }
    const toast = getToastForResult(result, undefined, true)
    expect(toast.status).toBe('success')
    expect(toast.title).toBe('Table imported')
    expect(toast.description).toContain('formatting preserved')
    expect(toast.description).toContain('2 × 2')
  })

  it('returns success toast for plain text import', () => {
    const result: ParseResult = {
      table: {headers: ['A', 'B'], rows: [['1', '2']]},
      warnings: [],
    }
    const toast = getToastForResult(result, undefined, false)
    expect(toast.status).toBe('success')
    expect(toast.description).toContain('plain text')
  })

  it('prioritises truncation warning over cell warnings', () => {
    const result: ParseResult = {
      table: {headers: ['A'], rows: [['1']]},
      warnings: [{row: 0, col: 0, reason: 'image'}],
    }
    const toast = getToastForResult(result, 500)
    expect(toast.status).toBe('warning')
    expect(toast.title).toBe('Table truncated')
  })

  it('always sets closable to true', () => {
    expect(getToastForResult(null).closable).toBe(true)
    expect(getToastForResult({table: {headers: null, rows: []}, warnings: []}).closable).toBe(true)
    expect(getToastForResult({table: {headers: ['A'], rows: [['1']]}, warnings: []}).closable).toBe(
      true,
    )
  })
})
