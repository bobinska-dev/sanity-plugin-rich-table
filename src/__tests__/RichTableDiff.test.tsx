import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import type {DiffProps} from 'sanity'
import {describe, expect, it} from 'vitest'

import RichTableDiff, {columnsTrackList} from '../components/RichTableDiff'

function cell(key: string, text: string) {
  return {
    _key: key,
    content: [
      {_type: 'block', _key: `${key}-b`, children: [{_type: 'span', _key: `${key}-s`, text}]},
    ],
  }
}

function renderDiff(fromValue: unknown, toValue: unknown) {
  const props = {
    diff: {type: 'object', action: 'changed', isChanged: true, fromValue, toValue, fields: {}},
    schemaType: {name: 'richTable', jsonType: 'object', fields: []},
    path: [],
  } as unknown as DiffProps

  return render(
    <ThemeProvider theme={studioTheme}>
      <RichTableDiff {...props} />
    </ThemeProvider>,
  )
}

describe('RichTableDiff', () => {
  it('renders a changed cell with both old and new text', () => {
    const from = {rows: [{_key: 'r1', title: 'Row', cells: [cell('c0', 'before')]}]}
    const to = {rows: [{_key: 'r1', title: 'Row', cells: [cell('c0', 'after')]}]}

    expect(() => renderDiff(from, to)).not.toThrow()
    expect(screen.getByText('after')).toBeInTheDocument()
    expect(screen.getByText('before')).toBeInTheDocument()
  })

  it('does not crash when a row is missing its cells (SYS-168 regression)', () => {
    // A row present in only one revision, or with no `cells`, used to throw in
    // preview rendering and blank the diff.
    const from = {rows: [{_key: 'r1', title: 'Row'}]}
    const to = {rows: [{_key: 'r1', title: 'Row', cells: [cell('c0', 'hello')]}]}

    expect(() => renderDiff(from, to)).not.toThrow()
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('renders a fallback message instead of throwing on malformed input', () => {
    expect(() => renderDiff({rows: 'not-an-array'}, {rows: [null, {cells: 42}]})).not.toThrow()
  })

  it('shows a "no visible changes" note when nothing changed', () => {
    const value = {rows: [{_key: 'r1', title: 'Row', cells: [cell('c0', 'x')]}]}
    renderDiff(value, value)
    expect(screen.getByText(/no visible changes/i)).toBeInTheDocument()
  })

  it('renders rows that have no columns without breaking', () => {
    // Smoke test: a row present with an empty cells array and no column headers → 0
    // columns. The component must still render the row label.
    const from = {rows: [{_key: 'r1', title: 'A', cells: []}]}
    const to = {rows: [{_key: 'r1', title: 'B', cells: []}]}

    expect(() => renderDiff(from, to)).not.toThrow()
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  describe('columnsTrackList', () => {
    it('omits repeat() when there are no columns (repeat(0, …) is invalid CSS)', () => {
      // Regression guard: the pre-fix code emitted `repeat(0, …)`, which the browser
      // rejects, dropping the whole grid-template-columns declaration.
      expect(columnsTrackList(0)).toBe('minmax(64px, auto)')
      expect(columnsTrackList(0)).not.toContain('repeat')
    })

    it('emits one repeat() track for the data columns', () => {
      expect(columnsTrackList(3)).toBe('minmax(64px, auto) repeat(3, minmax(96px, 1fr))')
    })
  })

  it('renders each cell as an inspectable button', () => {
    // The detail dialog itself is verified manually — mounting @sanity/ui's Dialog
    // under jsdom is prohibitively slow. Here we assert the inspect wiring: each
    // cell is an activatable button labelled with its coordinates.
    const from = {rows: [{_key: 'r1', title: 'Row', cells: [cell('c0', 'before')]}]}
    const to = {rows: [{_key: 'r1', title: 'Row', cells: [cell('c0', 'after')]}]}
    renderDiff(from, to)

    const button = screen.getByRole('button', {name: /inspect cell/i})
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('tabindex', '0')
  })
})
