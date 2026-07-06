import {describe, expect, it} from 'vitest'

import {parseHtmlTable} from '../parseHtmlTable'
import {MAX_IMPORT_ROWS} from '../types'

describe('parseHtmlTable', () => {
  it('parses a basic HTML table with th headers', () => {
    const html = `<table>
      <tr><th>Name</th><th>Age</th></tr>
      <tr><td>Alice</td><td>30</td></tr>
      <tr><td>Bob</td><td>25</td></tr>
    </table>`

    const result = parseHtmlTable(html)
    expect(result.table.headers).toEqual(['Name', 'Age'])
    expect(result.table.rows).toHaveLength(2)
    expect(result.warnings).toEqual([])
  })

  it('extracts plain text from cells', () => {
    const html = `<table>
      <tr><td>Hello</td><td>World</td></tr>
    </table>`

    const result = parseHtmlTable(html)
    const firstCell = result.table.rows[0][0]
    expect(Array.isArray(firstCell)).toBe(true)
    if (Array.isArray(firstCell)) {
      expect((firstCell[0] as any).children[0].text).toBe('Hello')
    }
  })

  it('preserves bold decorator from <strong>', () => {
    const html = `<table><tr><td><strong>Bold</strong></td></tr></table>`

    const result = parseHtmlTable(html)
    const cell = result.table.rows[0][0] as any[]
    expect(cell[0].children[0].marks).toContain('strong')
  })

  it('preserves italic from <em>', () => {
    const html = `<table><tr><td><em>Italic</em></td></tr></table>`

    const result = parseHtmlTable(html)
    const cell = result.table.rows[0][0] as any[]
    expect(cell[0].children[0].marks).toContain('em')
  })

  it('preserves code decorator from <code>', () => {
    const html = `<table><tr><td><code>code</code></td></tr></table>`

    const result = parseHtmlTable(html)
    const cell = result.table.rows[0][0] as any[]
    expect(cell[0].children[0].marks).toContain('code')
  })

  it('converts backtick-wrapped text to code decorator', () => {
    const html = `<table><tr><td>use \`someCommand\` here</td></tr></table>`

    const result = parseHtmlTable(html)
    const cell = result.table.rows[0][0] as any[]
    const spans = cell[0].children

    expect(spans).toHaveLength(3)
    expect(spans[0].text).toBe('use ')
    expect(spans[0].marks).not.toContain('code')
    expect(spans[1].text).toBe('someCommand')
    expect(spans[1].marks).toContain('code')
    expect(spans[2].text).toBe(' here')
    expect(spans[2].marks).not.toContain('code')
  })

  it('converts multiple backtick segments in a single cell', () => {
    const html = `<table><tr><td>\`foo\` and \`bar\`</td></tr></table>`

    const result = parseHtmlTable(html)
    const cell = result.table.rows[0][0] as any[]
    const spans = cell[0].children

    const codeSpans = spans.filter((s: any) => s.marks.includes('code'))
    expect(codeSpans).toHaveLength(2)
    expect(codeSpans[0].text).toBe('foo')
    expect(codeSpans[1].text).toBe('bar')
  })

  it('preserves inherited marks on backtick code spans', () => {
    const html = `<table><tr><td><b>bold \`code\` text</b></td></tr></table>`

    const result = parseHtmlTable(html)
    const cell = result.table.rows[0][0] as any[]
    const codeSpan = cell[0].children.find((s: any) => s.text === 'code')

    expect(codeSpan.marks).toContain('code')
    expect(codeSpan.marks).toContain('strong')
  })

  it('preserves underline from <u>', () => {
    const html = `<table><tr><td><u>underline</u></td></tr></table>`

    const result = parseHtmlTable(html)
    const cell = result.table.rows[0][0] as any[]
    expect(cell[0].children[0].marks).toContain('underline')
  })

  it('preserves strike-through from <s>', () => {
    const html = `<table><tr><td><s>deleted</s></td></tr></table>`

    const result = parseHtmlTable(html)
    const cell = result.table.rows[0][0] as any[]
    expect(cell[0].children[0].marks).toContain('strike-through')
  })

  it('detects bold from inline CSS font-weight', () => {
    const html = `<table><tr><td><span style="font-weight: bold">styled</span></td></tr></table>`

    const result = parseHtmlTable(html)
    const cell = result.table.rows[0][0] as any[]
    expect(cell[0].children[0].marks).toContain('strong')
  })

  it('detects italic from inline CSS font-style', () => {
    const html = `<table><tr><td><span style="font-style: italic">styled</span></td></tr></table>`

    const result = parseHtmlTable(html)
    const cell = result.table.rows[0][0] as any[]
    expect(cell[0].children[0].marks).toContain('em')
  })

  it('preserves link annotations from <a>', () => {
    const html = `<table><tr><td><a href="https://example.com">Link</a></td></tr></table>`

    const result = parseHtmlTable(html)
    const cell = result.table.rows[0][0] as any[]
    expect(cell[0].markDefs).toHaveLength(1)
    expect(cell[0].markDefs[0]).toMatchObject({_type: 'link', href: 'https://example.com'})
    expect(cell[0].children[0].text).toBe('Link')
  })

  it('handles bullet lists in cells', () => {
    const html = `<table><tr><td><ul><li>Item 1</li><li>Item 2</li></ul></td></tr></table>`

    const result = parseHtmlTable(html)
    const cell = result.table.rows[0][0] as any[]
    expect(cell).toHaveLength(2)
    expect(cell[0].listItem).toBe('bullet')
    expect(cell[1].listItem).toBe('bullet')
  })

  it('handles numbered lists in cells', () => {
    const html = `<table><tr><td><ol><li>First</li><li>Second</li></ol></td></tr></table>`

    const result = parseHtmlTable(html)
    const cell = result.table.rows[0][0] as any[]
    expect(cell[0].listItem).toBe('number')
  })

  it('creates visible placeholder span for images', () => {
    const html = `<table><tr><td><img src="photo.jpg" /></td></tr></table>`

    const result = parseHtmlTable(html)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0].reason).toBe('image')

    const cell = result.table.rows[0][0] as any[]
    expect(cell).toHaveLength(1)
    expect(cell[0].children[0].text).toContain('Could not import: image')
    expect(cell[0].children[0].marks).toContain('code')
  })

  it('creates visible placeholder span for iframes', () => {
    const html = `<table><tr><td><iframe src="https://example.com"></iframe></td></tr></table>`

    const result = parseHtmlTable(html)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0].reason).toBe('embedded media')

    const cell = result.table.rows[0][0] as any[]
    expect(cell).toHaveLength(1)
    expect(cell[0].children[0].text).toContain('Could not import: embedded media')
    expect(cell[0].children[0].marks).toContain('code')
  })

  it('keeps placeholder alongside text when a cell has text + image', () => {
    const html = `<table><tr><td>Caption <img src="photo.jpg" /> text</td></tr></table>`

    const result = parseHtmlTable(html)
    expect(result.warnings).toHaveLength(1)

    const cell = result.table.rows[0][0] as any[]
    const block = cell[0]
    const texts = block.children.map((c: any) => c.text)
    expect(texts.some((t: string) => t === 'Caption ')).toBe(true)
    expect(texts.some((t: string) => t.includes('Could not import: image'))).toBe(true)
    expect(texts.some((t: string) => t === ' text')).toBe(true)
  })

  it('handles Google Sheets formula error cells', () => {
    const html = `<table><tr><td data-sheets-formula="=SUM(A1:A3)">#REF!</td></tr></table>`

    const result = parseHtmlTable(html)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0].reason).toBe('formula')
  })

  it('uses computed value for successful formula cells', () => {
    const html = `<table><tr><td data-sheets-formula="=SUM(A1:A3)">150</td></tr></table>`

    const result = parseHtmlTable(html)
    expect(result.warnings).toHaveLength(0)
    const cell = result.table.rows[0][0] as any[]
    expect(cell[0].children[0].text).toBe('150')
  })

  it('returns empty result when no table element is present', () => {
    const html = '<p>Just a paragraph</p>'

    const result = parseHtmlTable(html)
    expect(result.table.rows).toEqual([])
  })

  it('handles mixed content: text + bold + link in one cell', () => {
    const html = `<table><tr><td>Hello <strong>world</strong> and <a href="https://x.com">link</a></td></tr></table>`

    const result = parseHtmlTable(html)
    const cell = result.table.rows[0][0] as any[]
    const block = cell[0]
    expect(block.children).toHaveLength(4)
    expect(block.children[0].text).toBe('Hello ')
    expect(block.children[1].text).toBe('world')
    expect(block.children[1].marks).toContain('strong')
    expect(block.children[2].text).toBe(' and ')
    expect(block.children[3].text).toBe('link')
  })

  // --- Container-level style detection (the previous bug) ---

  it('detects bold from CSS font-weight on the <td> itself', () => {
    const html = `<table><tr><td style="font-weight:bold">Bold on td</td></tr></table>`

    const result = parseHtmlTable(html)
    const cell = result.table.rows[0][0] as any[]
    expect(cell[0].children[0].marks).toContain('strong')
  })

  it('detects bold from font-weight:700 on the <td>', () => {
    const html = `<table><tr><td style="font-weight:700">Bold 700</td></tr></table>`

    const result = parseHtmlTable(html)
    const cell = result.table.rows[0][0] as any[]
    expect(cell[0].children[0].marks).toContain('strong')
  })

  it('detects italic from CSS font-style on the <td> itself', () => {
    const html = `<table><tr><td style="font-style:italic">Italic on td</td></tr></table>`

    const result = parseHtmlTable(html)
    const cell = result.table.rows[0][0] as any[]
    expect(cell[0].children[0].marks).toContain('em')
  })

  it('detects underline from CSS text-decoration on the <td>', () => {
    const html = `<table><tr><td style="text-decoration:underline">Underlined</td></tr></table>`

    const result = parseHtmlTable(html)
    const cell = result.table.rows[0][0] as any[]
    expect(cell[0].children[0].marks).toContain('underline')
  })

  it('detects strike-through from CSS text-decoration on the <td>', () => {
    const html = `<table><tr><td style="text-decoration:line-through">Struck</td></tr></table>`

    const result = parseHtmlTable(html)
    const cell = result.table.rows[0][0] as any[]
    expect(cell[0].children[0].marks).toContain('strike-through')
  })

  it('detects bold from CSS on a <p> inside a cell', () => {
    const html = `<table><tr><td><p style="font-weight:700">Bold paragraph</p></td></tr></table>`

    const result = parseHtmlTable(html)
    const cell = result.table.rows[0][0] as any[]
    expect(cell[0].children[0].marks).toContain('strong')
  })

  it('merges container and child marks without duplicates', () => {
    const html = `<table><tr><td style="font-weight:bold"><em>Bold and italic</em></td></tr></table>`

    const result = parseHtmlTable(html)
    const cell = result.table.rows[0][0] as any[]
    const marks = cell[0].children[0].marks
    expect(marks).toContain('strong')
    expect(marks).toContain('em')
  })

  it('does not duplicate marks when tag and style agree', () => {
    const html = `<table><tr><td><strong style="font-weight:bold">Double bold</strong></td></tr></table>`

    const result = parseHtmlTable(html)
    const cell = result.table.rows[0][0] as any[]
    const strongCount = cell[0].children[0].marks.filter((m: string) => m === 'strong').length
    expect(strongCount).toBe(1)
  })

  // --- Bold-header heuristic ---

  it('detects all-bold first row as headers (via <b> tags)', () => {
    const html = `<table>
      <tr><td><b>Name</b></td><td><b>Age</b></td></tr>
      <tr><td>Alice</td><td>30</td></tr>
    </table>`

    const result = parseHtmlTable(html)
    expect(result.table.headers).toEqual(['Name', 'Age'])
    expect(result.table.rows).toHaveLength(1)
  })

  it('detects all-bold first row as headers (via CSS font-weight on td)', () => {
    const html = `<table>
      <tr><td style="font-weight:bold">Name</td><td style="font-weight:700">Age</td></tr>
      <tr><td>Alice</td><td>30</td></tr>
    </table>`

    const result = parseHtmlTable(html)
    expect(result.table.headers).toEqual(['Name', 'Age'])
    expect(result.table.rows).toHaveLength(1)
  })

  it('does NOT treat mixed bold/non-bold first row as headers', () => {
    const html = `<table>
      <tr><td><b>Bold</b></td><td>Plain</td></tr>
      <tr><td>Alice</td><td>30</td></tr>
    </table>`

    const result = parseHtmlTable(html)
    expect(result.table.headers).toBeNull()
    expect(result.table.rows).toHaveLength(2)
  })

  it('does NOT treat single-row bold table as having headers', () => {
    const html = `<table>
      <tr><td><b>Only</b></td><td><b>Row</b></td></tr>
    </table>`

    const result = parseHtmlTable(html)
    expect(result.table.headers).toBeNull()
  })

  it('skips empty cells in bold-header detection', () => {
    const html = `<table>
      <tr><td><b>Name</b></td><td></td><td><b>Age</b></td></tr>
      <tr><td>Alice</td><td>-</td><td>30</td></tr>
    </table>`

    const result = parseHtmlTable(html)
    expect(result.table.headers).toEqual(['Name', '', 'Age'])
    expect(result.table.rows).toHaveLength(1)
  })

  // --- Nested bold detection (Google Sheets div>span pattern) ---

  it('detects headers when bold is on nested span inside div (Google Sheets)', () => {
    const html = `<table>
      <tr>
        <td><div><span style="font-weight:bold">Name</span></div></td>
        <td><div><span style="font-weight:700">Age</span></div></td>
      </tr>
      <tr><td>Alice</td><td>30</td></tr>
    </table>`

    const result = parseHtmlTable(html)
    expect(result.table.headers).toEqual(['Name', 'Age'])
    expect(result.table.rows).toHaveLength(1)
  })

  it('detects headers with deeply nested bold (span > b > text)', () => {
    const html = `<table>
      <tr>
        <td><span><b>Header</b></span></td>
        <td><div><span><strong>Other</strong></span></div></td>
      </tr>
      <tr><td>Data</td><td>Data</td></tr>
    </table>`

    const result = parseHtmlTable(html)
    expect(result.table.headers).toEqual(['Header', 'Other'])
  })

  it('rejects header detection when only some nested spans are bold', () => {
    const html = `<table>
      <tr>
        <td><div><span style="font-weight:bold">Bold</span></div></td>
        <td><div><span>Not bold</span></div></td>
      </tr>
      <tr><td>Data</td><td>Data</td></tr>
    </table>`

    const result = parseHtmlTable(html)
    expect(result.table.headers).toBeNull()
  })

  // --- Bold first column detection (hasRowTitles) ---

  it('detects all-bold first column as hasRowTitles', () => {
    const html = `<table>
      <tr><td><b>Row 1</b></td><td>Data A</td></tr>
      <tr><td><b>Row 2</b></td><td>Data B</td></tr>
      <tr><td><b>Row 3</b></td><td>Data C</td></tr>
    </table>`

    const result = parseHtmlTable(html)
    expect(result.table.hasRowTitles).toBe(true)
  })

  it('detects bold first column via CSS on span (Google Sheets)', () => {
    const html = `<table>
      <tr><td><span style="font-weight:bold">Q1</span></td><td>100</td></tr>
      <tr><td><span style="font-weight:700">Q2</span></td><td>200</td></tr>
    </table>`

    const result = parseHtmlTable(html)
    expect(result.table.hasRowTitles).toBe(true)
  })

  it('does NOT set hasRowTitles when first column is not all bold', () => {
    const html = `<table>
      <tr><td><b>Bold</b></td><td>Data</td></tr>
      <tr><td>Not bold</td><td>Data</td></tr>
    </table>`

    const result = parseHtmlTable(html)
    expect(result.table.hasRowTitles).toBe(false)
  })

  it('detects both headers and row titles in the same table', () => {
    const html = `<table>
      <tr><td><b>Category</b></td><td><b>Value</b></td></tr>
      <tr><td><b>Revenue</b></td><td>1000</td></tr>
      <tr><td><b>Costs</b></td><td>500</td></tr>
    </table>`

    const result = parseHtmlTable(html)
    expect(result.table.headers).toEqual(['Category', 'Value'])
    expect(result.table.hasRowTitles).toBe(true)
  })

  it('skips empty first-column cells in hasRowTitles detection', () => {
    const html = `<table>
      <tr><td><b>Row A</b></td><td>Data</td></tr>
      <tr><td></td><td>Data</td></tr>
      <tr><td><b>Row C</b></td><td>Data</td></tr>
    </table>`

    const result = parseHtmlTable(html)
    expect(result.table.hasRowTitles).toBe(true)
  })

  it('detects plain top row as headers in a labeled matrix (empty corner + bold row titles)', () => {
    // Classic spreadsheet layout: empty top-left corner, plain column headers
    // across the top, bold row titles down the side. The plain header row must
    // still be lifted into `headers` rather than kept as data row 1.
    const html = `<table>
      <tr><td></td><td>Name</td><td>Phone</td></tr>
      <tr><td><b>Office Manager</b></td><td>Øyvind</td><td>+47</td></tr>
      <tr><td><b>Cleaner</b></td><td>Billy</td><td>+44</td></tr>
    </table>`

    const result = parseHtmlTable(html)
    expect(result.table.headers).toEqual(['', 'Name', 'Phone'])
    expect(result.table.hasRowTitles).toBe(true)
    expect(result.table.rows).toHaveLength(2)
  })

  it('does NOT treat a non-empty corner as a matrix header', () => {
    // Corner cell has content → ambiguous, so do not lift the first row.
    const html = `<table>
      <tr><td>Region</td><td>Name</td></tr>
      <tr><td><b>North</b></td><td>Alice</td></tr>
      <tr><td><b>South</b></td><td>Bob</td></tr>
    </table>`

    const result = parseHtmlTable(html)
    expect(result.table.headers).toBeNull()
    expect(result.table.rows).toHaveLength(3)
  })

  // --- totalRows truncation ---

  it('sets totalRows when rows exceed MAX_IMPORT_ROWS', () => {
    const headerRow = '<tr><th>Col</th></tr>'
    const dataRows = Array.from(
      {length: MAX_IMPORT_ROWS + 30},
      (_, i) => `<tr><td>row${i}</td></tr>`,
    ).join('')
    const html = `<table>${headerRow}${dataRows}</table>`

    const result = parseHtmlTable(html)
    expect(result.table.rows).toHaveLength(MAX_IMPORT_ROWS)
    expect(result.totalRows).toBe(MAX_IMPORT_ROWS + 30)
  })

  it('does NOT set totalRows when rows are within limit', () => {
    const html = `<table>
      <tr><th>A</th></tr>
      <tr><td>1</td></tr>
      <tr><td>2</td></tr>
    </table>`

    const result = parseHtmlTable(html)
    expect(result.totalRows).toBeUndefined()
  })
})
