import {studioTheme, ThemeProvider} from '@sanity/ui'
import {fireEvent, render, screen} from '@testing-library/react'
import type {ComponentProps, ReactNode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

// The column menu registers its confirmation via the pane router's URL params.
// Mock it so the component renders without a Structure provider; an empty
// routerPanesState means "outside Structure" → local-state fallback.
const {mockPaneRouter} = vi.hoisted(() => ({
  mockPaneRouter: {
    params: {} as Record<string, string | undefined>,
    routerPanesState: [] as unknown[],
    setParams: vi.fn(),
  },
}))
vi.mock('sanity/structure', () => ({usePaneRouter: () => mockPaneRouter}))

import ColumnContextMenu from '../../components/ColumnContextMenu'
import {promoteDialogParamValue} from '../../hooks/useDialogRouteState'
import {RichTableType} from '../../schemas/richTable.object'

const wrapper = ({children}: {children: ReactNode}) => (
  <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
)

// A fully-keyed Portable Text cell carrying a single line of text.
const cell = (key: string, text: string) => ({
  _type: 'richTableCell' as const,
  _key: key,
  content: [
    {
      _type: 'block',
      _key: `b-${key}`,
      style: 'normal',
      markDefs: [],
      children: [{_type: 'span', _key: `s-${key}`, text, marks: []}],
    },
  ],
})

const value: RichTableType = {
  rows: [
    {_type: 'row', _key: 'r0', cells: [cell('c0', 'Name'), cell('c1', 'x')]},
    {_type: 'row', _key: 'r1', cells: [cell('c2', 'Ada'), cell('c3', 'y')]},
  ],
  columnHeaders: [
    {_type: 'columnHeader', _key: 'h0', cellIndex: 0},
    {_type: 'columnHeader', _key: 'h1', cellIndex: 1},
  ],
}

const renderMenu = (overrides: Partial<ComponentProps<typeof ColumnContextMenu>> = {}) => {
  const execute = vi.fn()
  render(
    <ColumnContextMenu
      columnIndex={0}
      columnHeaderKey="h0"
      columnCount={2}
      rowCount={2}
      value={value}
      patch={{execute} as never}
      path="myTable"
      readOnly={false}
      {...overrides}
    />,
    {wrapper},
  )
  return {execute}
}

describe('ColumnContextMenu – "Use as row titles"', () => {
  beforeEach(() => {
    mockPaneRouter.params = {}
    mockPaneRouter.routerPanesState = []
    mockPaneRouter.setParams = vi.fn()
  })

  it('flattens the first column into row titles, shows them, then removes the column', () => {
    const {execute} = renderMenu()

    fireEvent.click(screen.getByLabelText('Column options 1'))
    fireEvent.click(screen.getByText('Use as row titles'))

    // The menu item opens a confirmation dialog; nothing happens until confirmed.
    expect(execute).not.toHaveBeenCalled()
    fireEvent.click(screen.getByLabelText('Confirm: use column as row titles'))

    expect(execute).toHaveBeenCalledTimes(1)
    const [ops] = execute.mock.calls[0]

    // One title set per row (plain text from the first cell)…
    expect(ops[0].set['myTable.rows[_key=="r0"].title']).toBe('Name')
    expect(ops[1].set['myTable.rows[_key=="r1"].title']).toBe('Ada')
    // …make the row titles visible…
    expect(ops[2].set['myTable.hasRowTitles']).toBe(true)
    // …then the column-delete patches: unset the header, unset each cell, and
    // decrement the following header's cellIndex.
    expect(ops[3].unset).toEqual(['myTable.columnHeaders[_key=="h0"]'])
    expect(ops[4].unset).toEqual(['myTable.rows[0].cells[0]', 'myTable.rows[1].cells[0]'])
    expect(ops[5].dec).toEqual({'myTable.columnHeaders[0].cellIndex': 1})
  })

  it('is not offered on columns other than the first', () => {
    renderMenu({columnIndex: 1, columnHeaderKey: 'h1'})

    fireEvent.click(screen.getByLabelText('Column options 2'))
    expect(screen.queryByText('Use as row titles')).toBeNull()
  })

  it('is disabled when the table has only one column', () => {
    const {execute} = renderMenu({columnCount: 1})

    fireEvent.click(screen.getByLabelText('Column options 1'))
    fireEvent.click(screen.getByText('Use as row titles'))

    expect(execute).not.toHaveBeenCalled()
  })

  it('registers the confirmation in the URL params inside the Structure tool', () => {
    // Non-empty routerPanesState = inside Structure; preserve an existing param.
    mockPaneRouter.routerPanesState = [[{id: 'doc'}]]
    mockPaneRouter.params = {view: 'preview'}
    renderMenu()

    fireEvent.click(screen.getByLabelText('Column options 1'))
    fireEvent.click(screen.getByText('Use as row titles'))

    expect(mockPaneRouter.setParams).toHaveBeenCalledWith({
      view: 'preview',
      richTablePromote: promoteDialogParamValue('columnToRowTitles', 'myTable'),
    })
  })
})
