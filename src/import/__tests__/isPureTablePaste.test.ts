import {describe, expect, it} from 'vitest'

import {isPureTablePaste} from '../isPureTablePaste'

describe('isPureTablePaste', () => {
  describe('html', () => {
    it('treats a bare table as pure', () => {
      const html = '<table><tr><td>A</td><td>B</td></tr><tr><td>1</td><td>2</td></tr></table>'
      expect(isPureTablePaste(html, '', 'html')).toBe(true)
    })

    it('tolerates a small amount of surrounding whitespace/markers', () => {
      const html = '<!--StartFragment--><table><tr><td>A</td></tr></table><!--EndFragment-->'
      expect(isPureTablePaste(html, '', 'html')).toBe(true)
    })

    it('is not pure when significant prose surrounds the table', () => {
      const html =
        '<p>Here is a paragraph of prose that clearly exceeds the tolerance threshold.</p>' +
        '<table><tr><td>A</td></tr></table>'
      expect(isPureTablePaste(html, '', 'html')).toBe(false)
    })

    it('is not pure when the html payload is empty', () => {
      expect(isPureTablePaste('', '', 'html')).toBe(false)
    })
  })

  describe('markdown', () => {
    it('treats a table-only payload as pure', () => {
      const md = ['| Name | Age |', '| --- | --- |', '| Alice | 30 |', '| Bob | 25 |'].join('\n')
      expect(isPureTablePaste('', md, 'markdown')).toBe(true)
    })

    it('is not pure with prose before the table', () => {
      const md = [
        'This is a leading paragraph that is comfortably over the tolerance limit.',
        '| Name | Age |',
        '| --- | --- |',
        '| Alice | 30 |',
      ].join('\n')
      expect(isPureTablePaste('', md, 'markdown')).toBe(false)
    })

    it('is not pure with prose after the table', () => {
      const md = [
        '| Name | Age |',
        '| --- | --- |',
        '| Alice | 30 |',
        'And a trailing note that pushes well past the tolerance threshold here.',
      ].join('\n')
      expect(isPureTablePaste('', md, 'markdown')).toBe(false)
    })

    it('is not pure when there is no separator row', () => {
      const md = ['| Name | Age |', '| Alice | 30 |'].join('\n')
      expect(isPureTablePaste('', md, 'markdown')).toBe(false)
    })

    it('is not pure when the separator is the first line (no header row)', () => {
      const md = ['| --- | --- |', '| Alice | 30 |'].join('\n')
      expect(isPureTablePaste('', md, 'markdown')).toBe(false)
    })
  })

  describe('tsv', () => {
    it('treats tab-delimited rows as pure', () => {
      expect(isPureTablePaste('', 'Name\tAge\nAlice\t30', 'tsv')).toBe(true)
    })

    it('tolerates trailing blank lines', () => {
      expect(isPureTablePaste('', 'Name\tAge\nAlice\t30\n\n', 'tsv')).toBe(true)
    })

    it('is not pure when a non-empty line has no tab', () => {
      expect(isPureTablePaste('', 'Name\tAge\nplain trailing line', 'tsv')).toBe(false)
    })

    it('is not pure when the payload is empty', () => {
      expect(isPureTablePaste('', '', 'tsv')).toBe(false)
    })
  })

  it('returns false for an unhandled format (e.g. csv)', () => {
    expect(isPureTablePaste('', 'a,b\nc,d', 'csv')).toBe(false)
  })
})
