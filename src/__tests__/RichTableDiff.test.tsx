import {LayerProvider, PortalProvider, studioTheme, ThemeProvider} from '@sanity/ui'
import {fireEvent, render, screen} from '@testing-library/react'
import type {DiffProps} from 'sanity'
import {describe, expect, it} from 'vitest'

import RichTableDiff from '../components/RichTableDiff'

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
      <PortalProvider>
        <LayerProvider>
          <RichTableDiff {...props} />
        </LayerProvider>
      </PortalProvider>
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

  it('opens a detail dialog with before/after content when a cell is clicked', () => {
    const from = {rows: [{_key: 'r1', title: 'Row', cells: [cell('c0', 'before')]}]}
    const to = {rows: [{_key: 'r1', title: 'Row', cells: [cell('c0', 'after')]}]}
    renderDiff(from, to)

    fireEvent.click(screen.getByRole('button', {name: /inspect cell/i}))

    // Dialog shows the Before/After sections (rendered in a portal).
    expect(screen.getByText('Before')).toBeInTheDocument()
    expect(screen.getByText('After')).toBeInTheDocument()
    // Raw content is available for full context (e.g. images/custom blocks).
    expect(screen.getAllByText(/Raw content/i).length).toBeGreaterThan(0)
  })
})
