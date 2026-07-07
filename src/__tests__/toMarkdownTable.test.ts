import type {PortableTextBlock} from 'sanity'
import {describe, expect, it} from 'vitest'

import {parseMarkdownTable} from '../import/parseMarkdownTable'
import type {RichTableCellType} from '../schemas/cell.object'
import type {RichTableType} from '../schemas/richTable.object'
import {toMarkdownTable} from '../utils/toMarkdownTable'

let keyCounter = 0
const key = () => `k${keyCounter++}`

/** A cell whose content is one or more plain-text blocks. */
const cell = (...lines: string[]): RichTableCellType => ({
  _key: key(),
  content: lines.map(
    (text): PortableTextBlock => ({
      _type: 'block',
      _key: key(),
      children: [{_type: 'span', _key: key(), text, marks: []}],
      markDefs: [],
    }),
  ),
})

describe('toMarkdownTable', () => {
  it('serializes a table with column and row titles', () => {
    const table: RichTableType = {
      hasColumnTitles: true,
      hasRowTitles: true,
      columnHeaders: [
        {_key: key(), cellIndex: 0, title: 'A'},
        {_key: key(), cellIndex: 1, title: 'B'},
      ],
      rows: [
        {_key: key(), title: 'Row 1', cells: [cell('a1'), cell('b1')]},
        {_key: key(), title: 'Row 2', cells: [cell('a2'), cell('b2')]},
      ],
    }

    expect(toMarkdownTable(table)).toBe(
      [
        '|  | A | B |',
        '| --- | --- | --- |',
        '| **Row 1** | a1 | b1 |',
        '| **Row 2** | a2 | b2 |',
      ].join('\n'),
    )
  })

  it('emits a valid empty header row when there are no column titles', () => {
    const table: RichTableType = {
      rows: [
        {_key: key(), cells: [cell('a'), cell('b')]},
        {_key: key(), cells: [cell('c'), cell('d')]},
      ],
    }

    expect(toMarkdownTable(table)).toBe(
      ['|  |  |', '| --- | --- |', '| a | b |', '| c | d |'].join('\n'),
    )
  })

  it('orders header cells by cellIndex, not array order', () => {
    const table: RichTableType = {
      hasColumnTitles: true,
      columnHeaders: [
        {_key: key(), cellIndex: 1, title: 'B'},
        {_key: key(), cellIndex: 0, title: 'A'},
      ],
      rows: [{_key: key(), cells: [cell('a'), cell('b')]}],
    }

    expect(toMarkdownTable(table).split('\n')[0]).toBe('| A | B |')
  })

  it('pads ragged rows to the widest column count', () => {
    const table: RichTableType = {
      rows: [
        {_key: key(), cells: [cell('a'), cell('b'), cell('c')]},
        {_key: key(), cells: [cell('d')]},
      ],
    }

    const lines = toMarkdownTable(table).split('\n')
    expect(lines[2]).toBe('| a | b | c |')
    expect(lines[3]).toBe('| d |  |  |')
  })

  it('escapes pipes and folds newlines to <br>', () => {
    const table: RichTableType = {
      hasRowTitles: true,
      rows: [{_key: key(), title: 'a|b', cells: [cell('x | y', 'second line')]}],
    }

    const lines = toMarkdownTable(table).split('\n')
    expect(lines[2]).toBe('| **a\\|b** | x \\| y<br>second line |')
  })

  it('honours a custom cellToMarkdown serializer', () => {
    const table: RichTableType = {
      rows: [{_key: key(), cells: [cell('a'), cell('b')]}],
    }

    expect(toMarkdownTable(table, {cellToMarkdown: () => 'X'}).split('\n')[2]).toBe('| X | X |')
  })

  it('returns an empty string for a table with no columns', () => {
    expect(toMarkdownTable({rows: []})).toBe('')
    expect(toMarkdownTable({rows: [{_key: key(), cells: []}]})).toBe('')
  })

  it('round-trips back through parseMarkdownTable', () => {
    const table: RichTableType = {
      hasColumnTitles: true,
      hasRowTitles: true,
      columnHeaders: [
        {_key: key(), cellIndex: 0, title: 'A'},
        {_key: key(), cellIndex: 1, title: 'B'},
      ],
      rows: [
        {_key: key(), title: 'Row 1', cells: [cell('a1'), cell('b1')]},
        {_key: key(), title: 'Row 2', cells: [cell('a2'), cell('b2')]},
      ],
    }

    const {table: parsed} = parseMarkdownTable(toMarkdownTable(table))

    expect(parsed.headers).toEqual(['', 'A', 'B'])
    expect(parsed.hasRowTitles).toBe(true)
    expect(parsed.rows).toHaveLength(2)
    // Row-title column stays first; the data columns survive as plain strings.
    expect(parsed.rows[0][1]).toBe('a1')
    expect(parsed.rows[0][2]).toBe('b1')
  })
})
