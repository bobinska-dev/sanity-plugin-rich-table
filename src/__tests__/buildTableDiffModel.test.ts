import {describe, expect, it} from 'vitest'

import {buildTableDiffModel} from '../utils/buildTableDiffModel'

function cell(key: string, text: string) {
  return {
    _key: key,
    content: [
      {_type: 'block', _key: `${key}-b`, children: [{_type: 'span', _key: `${key}-s`, text}]},
    ],
  }
}

function row(key: string, title: string, texts: string[]) {
  return {_key: key, title, cells: texts.map((text, index) => cell(`${key}-c${index}`, text))}
}

type TableOpts = {
  headers?: Array<{_key?: string; title?: string; cellIndex: number}>
  hasColumnTitles?: boolean
  hasRowTitles?: boolean
}

function table(rows: ReturnType<typeof row>[], opts: TableOpts = {}) {
  return {
    rows,
    columnHeaders: opts.headers,
    hasColumnTitles: opts.hasColumnTitles ?? true,
    hasRowTitles: opts.hasRowTitles ?? true,
  }
}

describe('buildTableDiffModel', () => {
  it('reports no changes for identical tables', () => {
    const value = table([row('r1', 'A', ['x', 'y'])])
    const model = buildTableDiffModel(value, value)
    expect(model.hasChanges).toBe(false)
    expect(model.summary).toEqual({
      columnsAdded: 0,
      columnsRemoved: 0,
      columnsMoved: 0,
      rowsAdded: 0,
      rowsRemoved: 0,
      rowsMoved: 0,
      cellsChanged: 0,
    })
    expect(model.rows[0].status).toBe('unchanged')
  })

  it('handles both values being undefined', () => {
    const model = buildTableDiffModel(undefined, undefined)
    expect(model.hasChanges).toBe(false)
    expect(model.rows).toEqual([])
    expect(model.columns).toEqual([])
  })

  it('detects an added row', () => {
    const from = table([row('r1', 'A', ['x'])])
    const to = table([row('r1', 'A', ['x']), row('r2', 'B', ['y'])])
    const model = buildTableDiffModel(from, to)

    expect(model.summary.rowsAdded).toBe(1)
    expect(model.rows.find((r) => r.key === 'r1')?.status).toBe('unchanged')
    expect(model.rows.find((r) => r.key === 'r2')?.status).toBe('added')
    expect(model.rows.find((r) => r.key === 'r2')?.cells[0].status).toBe('added')
    expect(model.hasChanges).toBe(true)
  })

  it('detects a removed row and keeps it in the model', () => {
    const from = table([row('r1', 'A', ['x']), row('r2', 'B', ['y'])])
    const to = table([row('r1', 'A', ['x'])])
    const model = buildTableDiffModel(from, to)

    expect(model.summary.rowsRemoved).toBe(1)
    const removed = model.rows.find((r) => r.key === 'r2')
    expect(removed?.status).toBe('removed')
    expect(removed?.cells[0].fromText).toBe('y')
  })

  it('detects a changed cell', () => {
    const from = table([row('r1', 'A', ['x', 'y'])])
    const to = table([row('r1', 'A', ['x', 'CHANGED'])])
    const model = buildTableDiffModel(from, to)

    expect(model.summary.cellsChanged).toBe(1)
    // A content edit is reported at the cell level, not as a structural row change.
    expect(model.summary.rowsMoved).toBe(0)
    const changedRow = model.rows[0]
    expect(changedRow.status).toBe('unchanged')
    expect(changedRow.cells[0].status).toBe('unchanged')
    expect(changedRow.cells[1].status).toBe('changed')
    expect(changedRow.cells[1].fromText).toBe('y')
    expect(changedRow.cells[1].toText).toBe('CHANGED')
  })

  it('carries raw cell content for the detail inspector', () => {
    const from = table([row('r1', 'A', ['x'])])
    const to = table([row('r1', 'A', ['CHANGED'])])
    const model = buildTableDiffModel(from, to)

    const cellModel = model.rows[0].cells[0]
    expect(cellModel.fromContent).toEqual(from.rows[0].cells[0].content)
    expect(cellModel.toContent).toEqual(to.rows[0].cells[0].content)
  })

  it('ignores _key-only differences when comparing cell content', () => {
    const from = table([row('r1', 'A', ['same'])])
    const to = table([row('r1', 'A', ['same'])])
    // give the "to" cell a different _key to prove keys are ignored
    to.rows[0].cells[0]._key = 'totally-different-key'
    const model = buildTableDiffModel(from, to)
    expect(model.rows[0].cells[0].status).toBe('unchanged')
    expect(model.hasChanges).toBe(false)
  })

  it('detects an added column', () => {
    const from = table([row('r1', 'A', ['x'])])
    const to = table([row('r1', 'A', ['x', 'new'])])
    const model = buildTableDiffModel(from, to)

    expect(model.columns).toHaveLength(2)
    expect(model.columns[0].status).toBe('unchanged')
    expect(model.columns[1].status).toBe('added')
    expect(model.rows[0].cells[1].status).toBe('added')
    // added-column cells are attributed to the column, not counted as changed cells
    expect(model.summary.cellsChanged).toBe(0)
  })

  it('detects a removed (last) column by header key', () => {
    const from = table([row('r1', 'A', ['x', 'y'])], {
      headers: [
        {_key: 'h0', cellIndex: 0},
        {_key: 'h1', cellIndex: 1},
      ],
    })
    const to = table([row('r1', 'A', ['x'])], {headers: [{_key: 'h0', cellIndex: 0}]})
    const model = buildTableDiffModel(from, to)

    expect(model.columns).toHaveLength(2)
    expect(model.columns[0].status).toBe('unchanged')
    expect(model.columns[1].status).toBe('removed')
    const r = model.rows[0]
    expect(r.cells[0].status).toBe('unchanged')
    expect(r.cells[1].status).toBe('removed')
    expect(r.cells[1].fromText).toBe('y')
    expect(model.summary.cellsChanged).toBe(0)
    expect(model.hasChanges).toBe(true)
  })

  it('correctly attributes a removed middle column (aligns surviving columns by key)', () => {
    const from = table([row('r1', 'A', ['x', 'MID', 'z'])], {
      headers: [
        {_key: 'h0', cellIndex: 0},
        {_key: 'h1', cellIndex: 1},
        {_key: 'h2', cellIndex: 2},
      ],
    })
    const to = table([row('r1', 'A', ['x', 'z'])], {
      headers: [
        {_key: 'h0', cellIndex: 0},
        {_key: 'h2', cellIndex: 1},
      ],
    })
    const model = buildTableDiffModel(from, to)

    // Surviving columns first (unchanged), removed middle column appended.
    expect(model.columns.map((c) => c.status)).toEqual(['unchanged', 'unchanged', 'removed'])
    const r = model.rows[0]
    expect(r.cells.map((c) => c.status)).toEqual(['unchanged', 'unchanged', 'removed'])
    expect(r.cells[2].fromText).toBe('MID') // the removed column keeps its own content
    expect(r.cells[1].toText).toBe('z') // surviving column aligned by key, not misread as changed
    expect(model.summary.cellsChanged).toBe(0)
  })

  it('detects a changed column header title (structurally unchanged)', () => {
    const from = table([row('r1', 'A', ['x'])], {
      headers: [{_key: 'h0', title: 'Old', cellIndex: 0}],
    })
    const to = table([row('r1', 'A', ['x'])], {headers: [{_key: 'h0', title: 'New', cellIndex: 0}]})
    const model = buildTableDiffModel(from, to)

    expect(model.columns[0].status).toBe('unchanged')
    expect(model.columns[0].titleChanged).toBe(true)
    expect(model.columns[0].fromTitle).toBe('Old')
    expect(model.columns[0].toTitle).toBe('New')
    expect(model.hasChanges).toBe(true)
  })

  it('detects a moved row without counting cell changes', () => {
    const from = table([row('r1', 'A', ['x']), row('r2', 'B', ['y']), row('r3', 'C', ['z'])])
    const to = table([row('r2', 'B', ['y']), row('r1', 'A', ['x']), row('r3', 'C', ['z'])])
    const model = buildTableDiffModel(from, to)

    const moved = model.rows.filter((r) => r.status === 'moved')
    expect(moved.length).toBeGreaterThanOrEqual(1)
    expect(model.summary.rowsMoved).toBe(moved.length)
    expect(model.summary.cellsChanged).toBe(0)
    expect(model.summary.rowsRemoved).toBe(0)
    expect(model.hasChanges).toBe(true)
  })

  it('detects a moved column without counting cell changes', () => {
    const from = table([row('r1', 'A', ['x', 'y', 'z'])], {
      headers: [
        {_key: 'h0', cellIndex: 0},
        {_key: 'h1', cellIndex: 1},
        {_key: 'h2', cellIndex: 2},
      ],
    })
    const to = table([row('r1', 'A', ['y', 'x', 'z'])], {
      headers: [
        {_key: 'h1', cellIndex: 0},
        {_key: 'h0', cellIndex: 1},
        {_key: 'h2', cellIndex: 2},
      ],
    })
    const model = buildTableDiffModel(from, to)

    const moved = model.columns.filter((c) => c.status === 'moved')
    expect(moved.length).toBeGreaterThanOrEqual(1)
    expect(model.summary.columnsMoved).toBe(moved.length)
    expect(model.summary.cellsChanged).toBe(0)
  })

  it('detects a toggled hasColumnTitles flag', () => {
    const from = table([row('r1', 'A', ['x'])], {hasColumnTitles: true})
    const to = table([row('r1', 'A', ['x'])], {hasColumnTitles: false})
    const model = buildTableDiffModel(from, to)

    expect(model.columnTitlesToggled).toBe(true)
    expect(model.hasColumnTitles).toBe(false)
    expect(model.hasChanges).toBe(true)
  })

  it('aligns rows positionally when _key is missing', () => {
    const from = {rows: [{title: '', cells: [cell('a', 'x')]}]}
    const to = {rows: [{title: '', cells: [cell('a', 'y')]}]}
    const model = buildTableDiffModel(from, to)
    expect(model.rows).toHaveLength(1)
    expect(model.rows[0].status).toBe('unchanged') // same position → structurally unchanged
    expect(model.rows[0].cells[0].status).toBe('changed')
    expect(model.rows[0].cells[0].toText).toBe('y')
    expect(model.summary.cellsChanged).toBe(1)
  })
})
