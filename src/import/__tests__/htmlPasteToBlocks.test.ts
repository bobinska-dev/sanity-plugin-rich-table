import {describe, expect, it} from 'vitest'

import {htmlPasteToBlocks} from '../htmlPasteToBlocks'

const typeOf = (b: unknown) => (b as {_type?: string})._type
const textOf = (b: unknown) =>
  ((b as {children?: {text?: string}[]}).children ?? []).map((c) => c.text ?? '').join('')

describe('htmlPasteToBlocks', () => {
  it('returns [] for empty input', () => {
    expect(htmlPasteToBlocks('')).toEqual([])
  })

  it('keeps prose around a table, in order, with the table as a richTable block', () => {
    const html =
      '<p>Before the table.</p>' +
      '<table><tr><td>A1</td><td>B1</td></tr><tr><td>A2</td><td>B2</td></tr></table>' +
      '<p>After the table.</p>'

    const blocks = htmlPasteToBlocks(html)

    expect(blocks.map(typeOf)).toEqual(['block', 'richTableBlock', 'block'])
    expect(textOf(blocks[0])).toBe('Before the table.')
    expect(textOf(blocks[2])).toBe('After the table.')

    const table = blocks[1] as {rows?: unknown[]}
    expect(Array.isArray(table.rows)).toBe(true)
    expect(table.rows).toHaveLength(2)
  })

  it('produces no richTable for prose-only HTML', () => {
    const blocks = htmlPasteToBlocks('<p>Just some text</p><p>and more</p>')
    expect(blocks.every((b) => typeOf(b) === 'block')).toBe(true)
    expect(blocks.map(textOf)).toEqual(['Just some text', 'and more'])
  })

  it('lifts a table out of a wrapping element instead of flattening it', () => {
    const html = '<div><p>Intro</p><table><tr><td>x</td></tr></table></div>'
    const blocks = htmlPasteToBlocks(html)
    expect(blocks.map(typeOf)).toEqual(['block', 'richTableBlock'])
  })

  it('handles multiple tables interleaved with prose', () => {
    const html =
      '<p>one</p><table><tr><td>a</td></tr></table>' +
      '<p>two</p><table><tr><td>b</td></tr></table>'
    const blocks = htmlPasteToBlocks(html)
    expect(blocks.map(typeOf)).toEqual(['block', 'richTableBlock', 'block', 'richTableBlock'])
  })

  it('handles real clipboard HTML (meta prefix, wrapper, thead/tbody) mixed with prose', () => {
    const html =
      '<meta charset="utf-8">' +
      '<div>' +
      '<h1>Contacts</h1>' +
      '<p>Go through your office manager first.</p>' +
      '<table>' +
      '<thead><tr><th>Name</th><th>Phone</th></tr></thead>' +
      '<tbody><tr><td>Office Manager</td><td>+47 905 24 667</td></tr></tbody>' +
      '</table>' +
      '</div>'

    const blocks = htmlPasteToBlocks(html)
    const types = blocks.map(typeOf)

    // A richTable block must be produced (not flattened into prose).
    expect(types).toContain('richTableBlock')
    // Prose kept, and the table comes after the prose.
    expect(types.indexOf('block')).toBeLessThan(types.indexOf('richTableBlock'))

    const table = blocks.find((b) => typeOf(b) === 'richTableBlock') as {rows?: unknown[]}
    expect((table.rows ?? []).length).toBe(1)
  })

  it('preserves inline formatting in prose (bold → strong decorator)', () => {
    const html = '<p>plain <strong>bold</strong></p><table><tr><td>x</td></tr></table>'
    const blocks = htmlPasteToBlocks(html)
    const first = blocks[0] as {children?: {text?: string; marks?: string[]}[]}
    const boldSpan = first.children?.find((c) => c.text === 'bold')
    expect(boldSpan?.marks).toContain('strong')
  })
})
