import {studioTheme, ThemeProvider} from '@sanity/ui'
import {fireEvent, render, screen} from '@testing-library/react'
import type {ReactNode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {TableImportDialog} from '../TableImportDialog'
import type {XlsxParseResult} from '../types'

// The dialog lazy-loads the heavy SheetJS parser via `await import('./parseXlsxTable')`.
// Mock the module so the sheet-picker error path can be driven without a real
// workbook. `vi.hoisted` gives us a ref the (hoisted) `vi.mock` factory can use.
const {parseXlsxTable} = vi.hoisted(() => ({parseXlsxTable: vi.fn()}))
vi.mock('../parseXlsxTable', () => ({parseXlsxTable}))

// Button/Card/Select need a theme.
const wrapper = ({children}: {children: ReactNode}) => (
  <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
)

// Minimal two-sheet workbook result so the dialog renders the sheet <Select>.
const multiSheetResult: XlsxParseResult = {
  sheetNames: ['Sheet1', 'Sheet2'],
  table: {headers: null, rows: [['a', 'b']], hasRowTitles: false},
  warnings: [],
}

// Fake .xlsx File whose `arrayBuffer()` resolves. The bytes are irrelevant
// because `parseXlsxTable` is mocked.
const xlsxFile = {
  name: 'data.xlsx',
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
} as unknown as File

describe('TableImportDialog – sheet picker error path', () => {
  beforeEach(() => {
    parseXlsxTable.mockReset()
  })

  it('surfaces a readable error and clears loading when a sheet fails to parse', async () => {
    // 1st call = initial file load (succeeds, two sheets). 2nd call = the sheet
    // switch (rejects, mirroring a corrupt/unsupported sheet).
    parseXlsxTable
      .mockResolvedValueOnce(multiSheetResult)
      .mockRejectedValueOnce(new Error('corrupt sheet'))

    render(<TableImportDialog onClose={vi.fn()} onConfirm={vi.fn()} />, {wrapper})

    // Reveal the upload panel so its (role-queryable) controls become visible.
    fireEvent.click(screen.getByRole('tab', {name: /upload file/i}))

    // Drive the hidden file input to load the workbook and populate sheet names.
    // The Dialog renders in a portal, so query the document, not the container.
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, {target: {files: [xlsxFile]}})

    // The sheet <Select> only renders once >1 sheet is known — wait for it.
    const select = await screen.findByRole('combobox')
    expect(parseXlsxTable).toHaveBeenCalledTimes(1)

    // Switching sheets triggers the rejecting parse.
    fireEvent.change(select, {target: {value: 'Sheet2'}})

    // The catch surfaces a readable message that includes the underlying error…
    expect(await screen.findByText(/Failed to read sheet: corrupt sheet/i)).toBeInTheDocument()
    // …and the `finally` clears the spinner (regression: a dropped setLoading(false)
    // would leave the dialog stuck loading forever).
    expect(document.querySelector('[data-ui="Spinner"]')).toBeNull()
    // The sheet was parsed with the workbook buffer + the newly selected name.
    expect(parseXlsxTable).toHaveBeenNthCalledWith(2, expect.any(ArrayBuffer), 'Sheet2')
  })
})
