import {studioTheme, ThemeProvider} from '@sanity/ui'
import {fireEvent, render, screen} from '@testing-library/react'
import type {ReactNode} from 'react'
import {describe, expect, it, vi} from 'vitest'

import ConfirmClearTableDialog from '../../components/ConfirmClearTableDialog'

const wrapper = ({children}: {children: ReactNode}) => (
  <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
)

describe('ConfirmClearTableDialog', () => {
  it('unsets only the table fields, keeping the block/item shell intact', () => {
    const execute = vi.fn()
    const onClose = vi.fn()
    render(
      <ConfirmClearTableDialog
        patch={{execute} as never}
        path="myTable"
        open
        onClose={onClose}
        readOnly={false}
      />,
      {wrapper},
    )

    fireEvent.click(screen.getByLabelText('Confirm clear table'))

    // Fields only — never the bare table path, which would delete a
    // richTableBlock / array-item table's whole block/item shell.
    expect(execute).toHaveBeenCalledWith([
      {
        unset: [
          'myTable.rows',
          'myTable.columnHeaders',
          'myTable.hasColumnTitles',
          'myTable.hasRowTitles',
          'myTable.rowTitleWidth',
        ],
      },
    ])
    expect(onClose).toHaveBeenCalled()
  })

  it('does nothing when readOnly', () => {
    const execute = vi.fn()
    render(
      <ConfirmClearTableDialog
        patch={{execute} as never}
        path="myTable"
        open
        onClose={vi.fn()}
        readOnly
      />,
      {wrapper},
    )

    const confirm = screen.getByLabelText('Confirm clear table')
    expect(confirm).toBeDisabled()
    fireEvent.click(confirm)
    expect(execute).not.toHaveBeenCalled()
  })
})
