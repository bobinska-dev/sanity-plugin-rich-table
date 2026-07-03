import {studioTheme, ThemeProvider} from '@sanity/ui'
import {fireEvent, render, screen} from '@testing-library/react'
import type {ComponentProps, ReactNode} from 'react'
import {describe, expect, it, vi} from 'vitest'

import InitialiseTable from '../../components/InitialiseTable'

// Wrapper for Sanity UI components (Button/Card need a theme)
const wrapper = ({children}: {children: ReactNode}) => (
  <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
)

const renderPicker = (
  overrides: Partial<ComponentProps<typeof InitialiseTable>> = {},
): {onChange: ReturnType<typeof vi.fn>; execute: ReturnType<typeof vi.fn>; path: string} => {
  const onChange = vi.fn()
  const execute = vi.fn()
  const path = 'body[_key=="blockKey"]'

  render(
    <InitialiseTable
      path={path}
      patch={{execute} as never}
      readOnly={false}
      onChange={onChange}
      {...overrides}
    />,
    {wrapper},
  )

  return {onChange, execute, path}
}

// Selecting an N×M table = clicking the grid button with this aria-label.
const commit = (rows: number, cols: number) =>
  fireEvent.click(screen.getByLabelText(`Select ${rows} rows by ${cols} columns`))

describe('InitialiseTable – handleCommit (Portable Text / array member)', () => {
  it('patches only the table fields via onChange and never clears the object', () => {
    const {onChange, execute} = renderPicker({isInPortableText: true})

    commit(2, 3)

    // The existing block already owns its `_type`/`_key`; we must not go through
    // the document-operations patch, which would target a now-keyless block.
    expect(execute).not.toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledTimes(1)

    const {patches} = onChange.mock.calls[0][0]

    // Regression: NO `set` at the empty path — clearing to `{}` is what stripped
    // `_type`/`_key` and produced "Block … is missing a type name".
    const destructiveClear = patches.find(
      (p: {type: string; path: unknown[]}) => p.type === 'set' && p.path.length === 0,
    )
    expect(destructiveClear).toBeUndefined()

    // setIfMissing [] {} keeps the (already-existing) object in place.
    expect(patches.some((p: {type: string}) => p.type === 'setIfMissing')).toBe(true)

    const byField = (field: string) =>
      patches.find((p: {type: string; path: unknown[]}) => p.type === 'set' && p.path[0] === field)

    expect(byField('columnHeaders').value).toHaveLength(3)
    expect(byField('hasColumnTitles').value).toBe(true)
    expect(byField('hasRowTitles').value).toBe(true)

    const rows = byField('rows').value
    expect(rows).toHaveLength(2)
    expect(rows[0].cells).toHaveLength(3)
  })

  it('gives every cell a fully-keyed Portable Text block (missing-keys regression)', () => {
    const {onChange} = renderPicker({isInPortableText: true})

    commit(1, 1)

    const {patches} = onChange.mock.calls[0][0]
    const rows = patches.find(
      (p: {type: string; path: unknown[]}) => p.type === 'set' && p.path[0] === 'rows',
    ).value

    const block = rows[0].cells[0].content[0]
    expect(block._type).toBe('block')
    expect(typeof block._key).toBe('string')
    expect(block._key.length).toBeGreaterThan(0)
    expect(typeof block.children[0]._key).toBe('string')
    expect(block.children[0]._key.length).toBeGreaterThan(0)
  })
})

describe('InitialiseTable – handleCommit (plain object field)', () => {
  it('materialises the field then sets the full value via the document patch', () => {
    const {onChange, execute, path} = renderPicker({isInPortableText: false, isInArray: false})

    commit(2, 3)

    // Relative onChange materialises the field to {} (SAPP-3812 path handling)…
    expect(onChange).toHaveBeenCalledTimes(1)
    const {patches} = onChange.mock.calls[0][0]
    expect(patches).toHaveLength(1)
    expect(patches[0].type).toBe('set')
    expect(patches[0].path).toEqual([])
    expect(patches[0].value).toEqual({})

    // …then the absolute-path document patch writes the whole table value.
    expect(execute).toHaveBeenCalledTimes(1)
    const [ops] = execute.mock.calls[0]
    const value = ops[0].set[path]
    expect(value.rows).toHaveLength(2)
    expect(value.columnHeaders).toHaveLength(3)
    expect(value.hasColumnTitles).toBe(true)
  })
})
