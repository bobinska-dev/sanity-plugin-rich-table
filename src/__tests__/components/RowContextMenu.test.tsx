import {studioTheme, ThemeProvider} from '@sanity/ui'
import {fireEvent, render, screen} from '@testing-library/react'
import type {ComponentProps, ReactNode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

// The row menu registers its confirmation via the pane router's URL params.
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

import RowContextMenu from '../../components/RowContextMenu'
import {promoteDialogParamValue} from '../../hooks/useDialogRouteState'
import {RichTableType} from '../../schemas/richTable.object'
import {RichTableRowType} from '../../schemas/row.object'

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

const firstRow: RichTableRowType = {
  _type: 'row',
  _key: 'r0',
  cells: [cell('c0', 'Name'), cell('c1', 'Phone')],
}

const value: RichTableType = {
  rows: [firstRow, {_type: 'row', _key: 'r1', cells: [cell('c2', 'Ada'), cell('c3', '123')]}],
  columnHeaders: [
    {_type: 'columnHeader', _key: 'h0', cellIndex: 0},
    {_type: 'columnHeader', _key: 'h1', cellIndex: 1},
  ],
}

const renderMenu = (overrides: Partial<ComponentProps<typeof RowContextMenu>> = {}) => {
  const execute = vi.fn()
  render(
    <RowContextMenu
      row={firstRow}
      rowIndex={0}
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

describe('RowContextMenu – "Use as column titles"', () => {
  beforeEach(() => {
    mockPaneRouter.params = {}
    mockPaneRouter.routerPanesState = []
    mockPaneRouter.setParams = vi.fn()
  })

  it('flattens the first row into column titles, shows them, then removes the row', () => {
    const {execute} = renderMenu()

    fireEvent.click(screen.getByLabelText('Row options 1'))
    fireEvent.click(screen.getByText('Use as column titles'))

    // The menu item opens a confirmation dialog; nothing happens until confirmed.
    expect(execute).not.toHaveBeenCalled()
    fireEvent.click(screen.getByLabelText('Confirm: use row as column titles'))

    expect(execute).toHaveBeenCalledTimes(1)
    const [ops] = execute.mock.calls[0]

    // One title set per column header (plain text from the matching cell)…
    expect(ops[0].set['myTable.columnHeaders[_key=="h0"].title']).toBe('Name')
    expect(ops[1].set['myTable.columnHeaders[_key=="h1"].title']).toBe('Phone')
    // …then make the column titles visible…
    expect(ops[2].set['myTable.hasColumnTitles']).toBe(true)
    // …and finally remove the promoted row.
    expect(ops[3].unset).toEqual(['myTable.rows[0]'])
    expect(ops).toHaveLength(4)
  })

  it('is not offered on rows other than the first', () => {
    renderMenu({rowIndex: 1, row: value.rows![1]})

    fireEvent.click(screen.getByLabelText('Row options 2'))
    expect(screen.queryByText('Use as column titles')).toBeNull()
  })

  it('is disabled when the table has only one row', () => {
    const {execute} = renderMenu({rowCount: 1})

    fireEvent.click(screen.getByLabelText('Row options 1'))
    fireEvent.click(screen.getByText('Use as column titles'))

    expect(execute).not.toHaveBeenCalled()
  })

  it('registers the confirmation in the URL params inside the Structure tool', () => {
    // Non-empty routerPanesState = inside Structure; preserve an existing param.
    mockPaneRouter.routerPanesState = [[{id: 'doc'}]]
    mockPaneRouter.params = {view: 'preview'}
    renderMenu()

    fireEvent.click(screen.getByLabelText('Row options 1'))
    fireEvent.click(screen.getByText('Use as column titles'))

    expect(mockPaneRouter.setParams).toHaveBeenCalledWith({
      view: 'preview',
      richTablePromote: promoteDialogParamValue('rowToColumnTitles', 'myTable'),
    })
  })
})
