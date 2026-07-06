import {describe, expect, it} from 'vitest'

import {detectFormat} from '../detectFormat'
import {parseCsvTable} from '../parseCsvTable'
import {parseHtmlTable} from '../parseHtmlTable'
import {parseMarkdownTable} from '../parseMarkdownTable'
import {parseTsvTable} from '../parseTsvTable'
import {toRichTableValue} from '../toRichTableValue'
import type {ParseResult} from '../types'

type ClipboardFormat = 'html' | 'markdown' | 'tsv'

const PARSERS: Record<ClipboardFormat, (s: string) => ParseResult> = {
  html: parseHtmlTable,
  markdown: parseMarkdownTable,
  tsv: parseTsvTable,
}

/**
 * End-to-end tests that exercise the full pipeline:
 * detect format → parse → convert to RichTableValue.
 */
describe('integration: detect → parse → convert', () => {
  it('round-trips an HTML table from Google Sheets with formatting', () => {
    const html = `<table>
      <tr><td style="font-weight:bold">Name</td><td style="font-weight:bold">Role</td></tr>
      <tr><td>Alice</td><td><b>Engineer</b></td></tr>
      <tr><td>Bob</td><td><em>Designer</em></td></tr>
    </table>`

    const format = detectFormat(html, '')
    expect(format).toBe('html')

    const result = PARSERS[format as ClipboardFormat](html)
    expect(result.table.headers).toEqual(['Name', 'Role'])
    expect(result.table.rows).toHaveLength(2)

    const value = toRichTableValue(result.table)
    expect(value._type).toBe('richTable')
    expect(value.hasColumnTitles).toBe(true)
    expect(value.columnHeaders).toHaveLength(2)
    expect(value.rows).toHaveLength(2)

    // Every cell has non-empty content
    for (const row of value.rows) {
      for (const cell of row.cells) {
        expect(cell.content.length).toBeGreaterThan(0)
      }
    }
  })

  it('round-trips a markdown table', () => {
    const md = `| Feature | Status |
| ------- | ------ |
| Auth    | Done   |
| Search  | WIP    |`

    const format = detectFormat('', md)
    expect(format).toBe('markdown')

    const result = PARSERS[format as ClipboardFormat](md)
    const value = toRichTableValue(result.table)

    expect(value.hasColumnTitles).toBe(true)
    expect(value.columnHeaders[0].title).toBe('Feature')
    expect(value.columnHeaders[1].title).toBe('Status')
    expect(value.rows).toHaveLength(2)
  })

  it('round-trips a TSV from a spreadsheet copy', () => {
    const tsv = 'Product\tPrice\tQty\nWidget\t9.99\t100\nGadget\t24.50\t50'

    const format = detectFormat('', tsv)
    expect(format).toBe('tsv')

    const result = PARSERS[format as ClipboardFormat](tsv)
    const value = toRichTableValue(result.table)

    expect(value.hasColumnTitles).toBe(true)
    expect(value.rows).toHaveLength(2)
    expect(value.columnHeaders).toHaveLength(3)
  })

  it('round-trips a CSV via explicit format', () => {
    const csv = 'Name,Email\nAlice,alice@example.com\nBob,bob@example.com'

    const result = parseCsvTable(csv)
    const value = toRichTableValue(result.table)

    expect(value.hasColumnTitles).toBe(true)
    expect(value.rows).toHaveLength(2)
    expect(value.columnHeaders[0].title).toBe('Name')
  })

  it('preserves row titles through the full HTML pipeline', () => {
    const html = `<table>
      <tr><td style="font-weight:bold">Header Col</td><td style="font-weight:bold">Values</td></tr>
      <tr><td style="font-weight:bold">Row A</td><td>10</td></tr>
      <tr><td style="font-weight:bold">Row B</td><td>20</td></tr>
    </table>`

    const result = parseHtmlTable(html)
    expect(result.table.headers).toEqual(['Header Col', 'Values'])
    expect(result.table.hasRowTitles).toBe(true)

    const value = toRichTableValue(result.table)
    expect(value.hasRowTitles).toBe(true)
    expect(value.rows[0].title).toBe('Row A')
    expect(value.rows[1].title).toBe('Row B')

    // The row title column is excluded from data cells
    expect(value.columnHeaders).toHaveLength(1)
    expect(value.columnHeaders[0].title).toBe('Values')
    expect(value.rows[0].cells).toHaveLength(1)
  })

  it('handles an HTML table with placeholder cells end-to-end', () => {
    const html = `<table>
      <tr><th>Name</th><th>Photo</th></tr>
      <tr><td>Alice</td><td><img src="photo.jpg" /></td></tr>
    </table>`

    const result = parseHtmlTable(html)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0].reason).toBe('image')

    const value = toRichTableValue(result.table)
    const photoCell = value.rows[0].cells[1]
    const span = (photoCell.content[0] as any).children[0]
    expect(span.text).toContain('Could not import')
    expect(span.marks).toContain('code')
  })
})
