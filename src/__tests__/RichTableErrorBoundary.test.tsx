import {studioTheme, ThemeProvider} from '@sanity/ui'
import {fireEvent, render, screen} from '@testing-library/react'
import type {ReactNode} from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {RichTableErrorBoundary} from '../components/RichTableErrorBoundary'

const renderInTheme = (ui: ReactNode) =>
  render(<ThemeProvider theme={studioTheme}>{ui}</ThemeProvider>)

describe('RichTableErrorBoundary', () => {
  // React logs caught render errors to console.error; silence + inspect it here.
  let consoleError: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })
  afterEach(() => {
    consoleError.mockRestore()
  })

  it('renders its children unchanged when they do not throw', () => {
    renderInTheme(
      <RichTableErrorBoundary>
        <div>content ok</div>
      </RichTableErrorBoundary>,
    )
    expect(screen.getByText('content ok')).toBeInTheDocument()
  })

  it('shows a contained fallback (with the error message) when a child throws', () => {
    const Boom = () => {
      throw new Error('Objects are not valid as a React child')
    }
    renderInTheme(
      <RichTableErrorBoundary
        what="cell"
        title="This cell couldn’t be displayed"
        label="column 2, row 1"
      >
        <Boom />
      </RichTableErrorBoundary>,
    )
    expect(screen.getByText('This cell couldn’t be displayed')).toBeInTheDocument()
    expect(screen.getByText('Objects are not valid as a React child')).toBeInTheDocument()
  })

  it('always logs the crash to the console (with the what + location + message)', () => {
    const Boom = () => {
      throw new Error('kaboom')
    }
    renderInTheme(
      <RichTableErrorBoundary what="cell" label="column 2, row 1">
        <Boom />
      </RichTableErrorBoundary>,
    )
    const logged = consoleError.mock.calls.map((args: unknown[]) => String(args[0])).join('\n')
    expect(logged).toContain('[sanity-plugin-rich-table] a table cell failed to render')
    expect(logged).toContain('column 2, row 1')
    expect(logged).toContain('kaboom')
  })

  it('uses a generic title by default (no `title` prop)', () => {
    const Boom = () => {
      throw new Error('boom')
    }
    renderInTheme(
      <RichTableErrorBoundary>
        <Boom />
      </RichTableErrorBoundary>,
    )
    expect(screen.getByText('This content couldn’t be displayed')).toBeInTheDocument()
  })

  it('recovers via "Try again" once the child stops throwing', () => {
    let shouldThrow = true
    const Flaky = () => {
      if (shouldThrow) throw new Error('boom')
      return <div>recovered</div>
    }
    renderInTheme(
      <RichTableErrorBoundary title="This cell couldn’t be displayed">
        <Flaky />
      </RichTableErrorBoundary>,
    )
    expect(screen.getByText('This cell couldn’t be displayed')).toBeInTheDocument()

    shouldThrow = false
    fireEvent.click(screen.getByRole('button', {name: 'Try again'}))

    expect(screen.getByText('recovered')).toBeInTheDocument()
    expect(screen.queryByText('This cell couldn’t be displayed')).not.toBeInTheDocument()
  })
})
