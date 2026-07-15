import * as XLSX from '@e965/xlsx'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {parseXlsxTable} from '../parseXlsxTable'
import {PLACEHOLDER_PREFIX} from '../placeholders'
import {MAX_IMPORT_ROWS} from '../types'

/**
 * Post-processing hook applied to the workbook returned by `XLSX.read` in
 * tests. Reset between tests via `afterEach`. When set, the hook receives
 * the real parsed workbook and can mutate it (e.g. inject stub cells or
 * fake zip-entry keys) before `parseXlsxTable` continues processing.
 */
let readPostProcess: ((wb: XLSX.WorkBook) => void) | null = null

vi.mock('@e965/xlsx', async () => {
  const actual = await vi.importActual<typeof XLSX>('@e965/xlsx')
  return {
    ...actual,
    read: (...args: Parameters<typeof actual.read>) => {
      const wb = actual.read(...args)
      readPostProcess?.(wb)
      return wb
    },
  }
})

afterEach(() => {
  readPostProcess = null
})

function createWorkbook(sheets: Record<string, unknown[][]>): ArrayBuffer {
  const wb = XLSX.utils.book_new()
  for (const [name, data] of Object.entries(sheets)) {
    const ws = XLSX.utils.aoa_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, name)
  }
  return XLSX.write(wb, {type: 'array', bookType: 'xlsx'})
}

/** Extracts the text content from a PT-block cell for easy assertion. */
function cellText(cell: unknown): string {
  if (typeof cell === 'string') return cell
  if (Array.isArray(cell)) {
    return cell
      .map((block: any) => (block.children ?? []).map((span: any) => span.text ?? '').join(''))
      .join('\n')
  }
  return ''
}

describe('parseXlsxTable (via sheet_to_html → parseHtmlTable)', () => {
  /**
   * SheetJS `sheet_to_html` renders all cells as `<td>` (never `<th>`) and
   * does not apply bold styling, so `parseHtmlTable`'s header heuristic will
   * not auto-detect column headers. The first row appears as a data row.
   */
  it('parses a basic Excel sheet and returns PT blocks (no auto-headers)', () => {
    const buf = createWorkbook({
      Sheet1: [
        ['Name', 'Age'],
        ['Alice', '30'],
        ['Bob', '25'],
      ],
    })
    const result = parseXlsxTable(buf)

    expect(result.sheetNames).toEqual(['Sheet1'])
    expect(result.table.headers).toBeNull()
    expect(result.table.rows).toHaveLength(3)
    expect(cellText(result.table.rows[0][0])).toBe('Name')
    expect(cellText(result.table.rows[1][0])).toBe('Alice')
    expect(cellText(result.table.rows[2][0])).toBe('Bob')
  })

  it('returns empty result for empty sheet', () => {
    const buf = createWorkbook({Sheet1: []})
    const result = parseXlsxTable(buf)
    expect(result.table.headers).toBeNull()
    expect(result.table.rows).toEqual([])
  })

  it('returns all sheet names', () => {
    const buf = createWorkbook({
      People: [['Name'], ['Alice']],
      Scores: [['Score'], ['100']],
    })
    const result = parseXlsxTable(buf)
    expect(result.sheetNames).toEqual(['People', 'Scores'])
  })

  it('parses a specific sheet by name', () => {
    const buf = createWorkbook({
      People: [['Name'], ['Alice']],
      Scores: [['Score'], ['100']],
    })
    const result = parseXlsxTable(buf, 'Scores')
    expect(cellText(result.table.rows[0][0])).toBe('Score')
    expect(cellText(result.table.rows[1][0])).toBe('100')
  })

  it('returns empty result for non-existent sheet name', () => {
    const buf = createWorkbook({Sheet1: [['A'], ['B']]})
    const result = parseXlsxTable(buf, 'Nope')
    expect(result.table.rows).toEqual([])
  })

  it('converts numeric cells to readable text', () => {
    const buf = createWorkbook({
      Sheet1: [['Val'], [42]],
    })
    const result = parseXlsxTable(buf)
    expect(cellText(result.table.rows[1][0])).toBe('42')
  })

  it('truncates rows beyond MAX_IMPORT_ROWS and sets totalRows', () => {
    const header = ['Col']
    const dataRows = Array.from({length: MAX_IMPORT_ROWS + 50}, (_, i) => [String(i)])
    const buf = createWorkbook({Sheet1: [header, ...dataRows]})
    const result = parseXlsxTable(buf)
    expect(result.table.rows.length).toBe(MAX_IMPORT_ROWS)
    expect(result.totalRows).toBeGreaterThan(MAX_IMPORT_ROWS)
  })

  it('handles single-row sheet', () => {
    const buf = createWorkbook({Sheet1: [['Alice', '30']]})
    const result = parseXlsxTable(buf)
    expect(result.table.rows).toHaveLength(1)
    expect(cellText(result.table.rows[0][0])).toBe('Alice')
  })

  it('trims trailing empty columns that extend beyond the data', () => {
    const buf = createWorkbook({
      Sheet1: [
        ['Name', 'Age', '', '', ''],
        ['Alice', '30', '', '', ''],
        ['Bob', '25', '', '', ''],
      ],
    })
    const result = parseXlsxTable(buf)

    const maxCols = Math.max(...result.table.rows.map((r) => r.length))
    expect(maxCols).toBe(2)
  })

  it('keeps columns that have data in at least one row', () => {
    const buf = createWorkbook({
      Sheet1: [
        ['A', 'B', 'C'],
        ['1', '', '3'],
        ['4', '5', ''],
      ],
    })
    const result = parseXlsxTable(buf)

    const maxCols = Math.max(...result.table.rows.map((r) => r.length))
    expect(maxCols).toBe(3)
  })
})

describe('parseXlsxTable — stub-cell placeholders', () => {
  it('injects a placeholder block for a stub cell in a data row', () => {
    const buf = createWorkbook({
      Sheet1: [
        ['Name', 'Photo'],
        ['Alice', ''],
        ['Bob', 'portrait.png'],
      ],
    })

    readPostProcess = (wb) => {
      wb.Sheets[wb.SheetNames[0]].B2 = {t: 'z'}
    }

    const result = parseXlsxTable(buf)

    const stubCell = result.table.rows[1]?.[1]
    expect(Array.isArray(stubCell)).toBe(true)
    const text = cellText(stubCell)
    expect(text).toContain(PLACEHOLDER_PREFIX)
    expect(text).toContain('image')

    expect(result.warnings).toContainEqual(
      expect.objectContaining({row: 1, col: 1, reason: 'image'}),
    )
  })

  it('injects placeholders for multiple stub cells', () => {
    const buf = createWorkbook({
      Sheet1: [
        ['A', 'B', 'C'],
        ['1', '', ''],
        ['4', '', '6'],
      ],
    })

    readPostProcess = (wb) => {
      const ws = wb.Sheets[wb.SheetNames[0]]
      ws.B2 = {t: 'z'}
      ws.C2 = {t: 'z'}
      ws.B3 = {t: 'z'}
    }

    const result = parseXlsxTable(buf)

    expect(cellText(result.table.rows[1]?.[1])).toContain(PLACEHOLDER_PREFIX)
    expect(cellText(result.table.rows[1]?.[2])).toContain(PLACEHOLDER_PREFIX)
    expect(cellText(result.table.rows[2]?.[1])).toContain(PLACEHOLDER_PREFIX)

    const imageWarnings = result.warnings.filter((w) => w.reason === 'image')
    expect(imageWarnings).toHaveLength(3)
  })

  it('does not add embedded-object warning when stubs are found', () => {
    const buf = createWorkbook({
      Sheet1: [
        ['A', 'B'],
        ['1', ''],
      ],
    })

    readPostProcess = (wb) => {
      const ws = wb.Sheets[wb.SheetNames[0]]
      ws.B2 = {t: 'z'}
      ;(wb as unknown as Record<string, unknown>).keys = [
        '[Content_Types].xml',
        'xl/drawings/drawing1.xml',
        'xl/worksheets/sheet1.xml',
      ]
    }

    const result = parseXlsxTable(buf)

    const drawingWarnings = result.warnings.filter((w) => w.reason.includes('file uploads'))
    expect(drawingWarnings).toHaveLength(0)

    const imageWarnings = result.warnings.filter((w) => w.reason === 'image')
    expect(imageWarnings).toHaveLength(1)
  })
})

describe('parseXlsxTable — embedded-object warning fallback', () => {
  it('adds a warning when xl/drawings/ entries exist (OOXML)', () => {
    const buf = createWorkbook({
      Sheet1: [
        ['A', 'B'],
        ['1', '2'],
      ],
    })

    readPostProcess = (wb) => {
      ;(wb as unknown as Record<string, unknown>).keys = [
        '[Content_Types].xml',
        'xl/drawings/drawing1.xml',
        'xl/worksheets/sheet1.xml',
      ]
    }

    const result = parseXlsxTable(buf)

    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        reason: expect.stringContaining('file uploads'),
      }),
    )
  })

  it('adds a warning when !objects exist on the worksheet (BIFF)', () => {
    const buf = createWorkbook({
      Sheet1: [
        ['A', 'B'],
        ['1', '2'],
      ],
    })

    readPostProcess = (wb) => {
      const ws = wb.Sheets[wb.SheetNames[0]]
      ;(ws as unknown as Record<string, unknown>)['!objects'] = {
        1: {cmo: [1, 0x08, 0]},
      }
    }

    const result = parseXlsxTable(buf)

    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        reason: expect.stringContaining('file uploads'),
      }),
    )
  })

  it('does not add a warning when no xl/drawings/ entries exist', () => {
    const buf = createWorkbook({
      Sheet1: [
        ['A', 'B'],
        ['1', '2'],
      ],
    })

    readPostProcess = (wb) => {
      ;(wb as unknown as Record<string, unknown>).keys = [
        '[Content_Types].xml',
        'xl/worksheets/sheet1.xml',
      ]
    }

    const result = parseXlsxTable(buf)

    expect(result.warnings).toHaveLength(0)
  })

  it('does not add a warning when keys property is absent and no !objects', () => {
    const buf = createWorkbook({
      Sheet1: [
        ['A', 'B'],
        ['1', '2'],
      ],
    })

    const result = parseXlsxTable(buf)

    const drawingWarnings = result.warnings.filter((w) => w.reason.includes('file uploads'))
    expect(drawingWarnings).toHaveLength(0)
  })
})
