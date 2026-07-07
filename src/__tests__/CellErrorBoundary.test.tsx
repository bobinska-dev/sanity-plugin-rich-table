import {studioTheme, ThemeProvider} from '@sanity/ui'
import {fireEvent, render, screen} from '@testing-library/react'
import type {ReactNode} from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {CellErrorBoundary} from '../components/CellErrorBoundary'

const renderInTheme = (ui: ReactNode) =>
  render(<ThemeProvider theme={studioTheme}>{ui}</ThemeProvider>)

describe('CellErrorBoundary', () => {
  // React logs caught render errors to console.error; silence it for these tests.
  let consoleError: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })
  afterEach(() => {
    consoleError.mockRestore()
  })

  it('renders its children unchanged when they do not throw', () => {
    renderInTheme(
      <CellErrorBoundary>
        <div>cell ok</div>
      </CellErrorBoundary>,
    )
    expect(screen.getByText('cell ok')).toBeInTheDocument()
  })

  it('shows a contained fallback (with the error message) when a child throws', () => {
    const Boom = () => {
      throw new Error('Objects are not valid as a React child')
    }
    renderInTheme(
      <CellErrorBoundary label="column 2, row 1">
        <Boom />
      </CellErrorBoundary>,
    )
    expect(screen.getByText('This cell couldn’t be displayed')).toBeInTheDocument()
    expect(screen.getByText('Objects are not valid as a React child')).toBeInTheDocument()
    // Logged for debugging, scoped to the offending cell.
    expect(consoleError).toHaveBeenCalled()
  })

  it('recovers via "Try again" once the child stops throwing', () => {
    let shouldThrow = true
    const Flaky = () => {
      if (shouldThrow) throw new Error('boom')
      return <div>recovered</div>
    }
    renderInTheme(
      <CellErrorBoundary>
        <Flaky />
      </CellErrorBoundary>,
    )
    expect(screen.getByText('This cell couldn’t be displayed')).toBeInTheDocument()

    shouldThrow = false
    fireEvent.click(screen.getByRole('button', {name: 'Try again'}))

    expect(screen.getByText('recovered')).toBeInTheDocument()
    expect(screen.queryByText('This cell couldn’t be displayed')).not.toBeInTheDocument()
  })
})
