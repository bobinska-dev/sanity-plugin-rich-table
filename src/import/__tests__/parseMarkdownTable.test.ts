import {describe, expect, it} from 'vitest'

import {parseMarkdownTable} from '../parseMarkdownTable'
import {MAX_IMPORT_ROWS} from '../types'

describe('parseMarkdownTable', () => {
  it('parses a standard markdown table', () => {
    const md = `| Name  | Role     |
| ----- | -------- |
| Alice | Engineer |
| Bob   | Designer |`

    const result = parseMarkdownTable(md)

    expect(result.table.headers).toEqual(['Name', 'Role'])
    expect(result.table.rows).toHaveLength(2)
    expect(result.table.rows[0]).toEqual(['Alice', 'Engineer'])
    expect(result.table.rows[1]).toEqual(['Bob', 'Designer'])
    expect(result.warnings).toEqual([])
  })

  it('handles alignment markers in separator', () => {
    const md = `| Left | Center | Right |
| :--- | :----: | ----: |
| a    | b      | c     |`

    const result = parseMarkdownTable(md)
    expect(result.table.headers).toEqual(['Left', 'Center', 'Right'])
    expect(result.table.rows).toEqual([['a', 'b', 'c']])
  })

  it('returns empty when no separator row is found', () => {
    const md = '| just | a | row |'
    const result = parseMarkdownTable(md)

    expect(result.table.headers).toBeNull()
    expect(result.table.rows).toEqual([])
  })

  it('handles empty cells', () => {
    const md = `| A | B |
| - | - |
| x |   |
|   | y |`

    const result = parseMarkdownTable(md)
    expect(result.table.rows).toHaveLength(2)
    expect(result.table.rows[0]).toEqual(['x', ''])
    expect(result.table.rows[1]).toEqual(['', 'y'])
  })

  it('trims whitespace from cells', () => {
    const md = `|  Name  |  Value  |
| ------ | ------- |
|  foo   |  bar    |`

    const result = parseMarkdownTable(md)
    expect(result.table.headers).toEqual(['Name', 'Value'])
    expect(result.table.rows).toEqual([['foo', 'bar']])
  })

  it('handles tables without leading/trailing pipes on body rows', () => {
    const md = `| H1 | H2 |
| -- | -- |
| a  | b  |`

    const result = parseMarkdownTable(md)
    expect(result.table.rows).toEqual([['a', 'b']])
  })

  // --- Inline formatting via @portabletext/markdown ---

  it('converts **bold** markdown to PT with strong decorator', () => {
    const md = `| Col |
| --- |
| **bold text** |`

    const result = parseMarkdownTable(md)
    const cell = result.table.rows[0][0]
    expect(Array.isArray(cell)).toBe(true)
    if (Array.isArray(cell)) {
      const spans = (cell[0] as any).children
      expect(
        spans.some((s: any) => s.text.includes('bold text') && s.marks.includes('strong')),
      ).toBe(true)
    }
  })

  it('converts *italic* markdown to PT with em decorator', () => {
    const md = `| Col |
| --- |
| *italic* |`

    const result = parseMarkdownTable(md)
    const cell = result.table.rows[0][0]
    expect(Array.isArray(cell)).toBe(true)
    if (Array.isArray(cell)) {
      const spans = (cell[0] as any).children
      expect(spans.some((s: any) => s.text.includes('italic') && s.marks.includes('em'))).toBe(true)
    }
  })

  it('converts `code` markdown to PT with code decorator', () => {
    const md = `| Col |
| --- |
| \`code\` |`

    const result = parseMarkdownTable(md)
    const cell = result.table.rows[0][0]
    expect(Array.isArray(cell)).toBe(true)
    if (Array.isArray(cell)) {
      const spans = (cell[0] as any).children
      expect(spans.some((s: any) => s.text === 'code' && s.marks.includes('code'))).toBe(true)
    }
  })

  it('converts [link](url) markdown to PT with link annotation', () => {
    const md = `| Col |
| --- |
| [Sanity](https://sanity.io) |`

    const result = parseMarkdownTable(md)
    const cell = result.table.rows[0][0]
    expect(Array.isArray(cell)).toBe(true)
    if (Array.isArray(cell)) {
      const block = cell[0] as any
      expect(block.markDefs.length).toBeGreaterThanOrEqual(1)
      expect(block.markDefs[0]).toMatchObject({_type: 'link', href: 'https://sanity.io'})
    }
  })

  it('creates placeholder for ![image](url) in cells', () => {
    const md = `| Col |
| --- |
| ![photo](https://example.com/img.png) |`

    const result = parseMarkdownTable(md)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0].reason).toBe('image')

    const cell = result.table.rows[0][0]
    expect(Array.isArray(cell)).toBe(true)
    if (Array.isArray(cell)) {
      const block = cell[0] as any
      expect(block.children[0].text).toContain('Could not import: image')
      expect(block.children[0].marks).toContain('code')
    }
  })

  it('keeps plain cells as strings (fast path)', () => {
    const md = `| A | B |
| - | - |
| hello | world |`

    const result = parseMarkdownTable(md)
    expect(result.table.rows[0][0]).toBe('hello')
    expect(result.table.rows[0][1]).toBe('world')
  })

  it('strips markdown from headers', () => {
    const md = `| **Bold Header** | *Italic Header* |
| --- | --- |
| a | b |`

    const result = parseMarkdownTable(md)
    expect(result.table.headers).toEqual(['Bold Header', 'Italic Header'])
  })

  // --- Bold first-column heuristic (hasRowTitles) ---

  it('detects all-bold first column as hasRowTitles', () => {
    const md = `| Category | Value |
| -------- | ----- |
| **Revenue** | 100 |
| **Costs** | 50 |`

    const result = parseMarkdownTable(md)
    expect(result.table.hasRowTitles).toBe(true)
  })

  it('does NOT set hasRowTitles when first column is not all bold', () => {
    const md = `| Category | Value |
| -------- | ----- |
| **Revenue** | 100 |
| Costs | 50 |`

    const result = parseMarkdownTable(md)
    expect(result.table.hasRowTitles).toBeFalsy()
  })

  // --- totalRows truncation ---

  it('sets totalRows when rows exceed MAX_IMPORT_ROWS', () => {
    const headerLine = '| Col |'
    const separatorLine = '| --- |'
    const dataLines = Array.from({length: MAX_IMPORT_ROWS + 20}, (_, i) => `| row${i} |`)
    const md = [headerLine, separatorLine, ...dataLines].join('\n')

    const result = parseMarkdownTable(md)
    expect(result.table.rows).toHaveLength(MAX_IMPORT_ROWS)
    expect(result.totalRows).toBe(MAX_IMPORT_ROWS + 20)
  })

  it('does NOT set totalRows when rows are within limit', () => {
    const md = `| A |
| - |
| 1 |
| 2 |`

    const result = parseMarkdownTable(md)
    expect(result.totalRows).toBeUndefined()
  })

  it('does not treat an all-empty first column as row titles', () => {
    const md = `| | Name |
| - | - |
| | Alice |
| | Bob |`
    expect(parseMarkdownTable(md).table.hasRowTitles).toBeUndefined()
  })

  it('detects a bold-wrapped first column as row titles', () => {
    const md = `| | Name |
| - | - |
| **Row 1** | Alice |
| **Row 2** | Bob |`
    expect(parseMarkdownTable(md).table.hasRowTitles).toBe(true)
  })
})
