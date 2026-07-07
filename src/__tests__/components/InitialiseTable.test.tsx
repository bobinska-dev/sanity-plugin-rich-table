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
  // Tests may override `path` to exercise deeply nested fields; keep the
  // returned path in sync with whatever the component actually rendered with.
  const path = overrides.path ?? 'body[_key=="blockKey"]'

  render(
    <InitialiseTable
      patch={{execute} as never}
      readOnly={false}
      onChange={onChange}
      {...overrides}
      path={path}
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

// SAPP-3812: initialising a richTable field nested inside an array item threw
// "Cannot apply deep operations on primitive values" because the size picker
// sent a `set` at the field's ABSOLUTE document path through `onChange` — the
// form's relative-path API. The materialise patch must always target the empty
// (relative) path, no matter how deep the field is.
describe('InitialiseTable – deeply nested object field (SAPP-3812 regression)', () => {
  const deepFieldPaths = [
    'pageBuilder[_key=="abc"].tableContent', // table field on a page-builder block
    'pageBuilder[_key=="abc"].group.tableContent', // wrapped one object level deeper
    'sections[_key=="s1"].columns[_key=="c1"].tableContent', // array → item → array → item → field
  ]

  it.each(deepFieldPaths)(
    'materialises %s with a relative empty-path patch, never the absolute path',
    (path) => {
      const {onChange, execute} = renderPicker({isInPortableText: false, isInArray: false, path})

      commit(2, 3)

      // The crux of the fix: the onChange patch is at the EMPTY path (relative to
      // this input), not the absolute document path that caused the crash.
      expect(onChange).toHaveBeenCalledTimes(1)
      const {patches} = onChange.mock.calls[0][0]
      expect(patches).toHaveLength(1)
      expect(patches[0]).toMatchObject({type: 'set', path: [], value: {}})
      expect(path.length).toBeGreaterThan(0) // guard: these really are nested paths

      // The full value is written by the absolute-path document-operations patch.
      expect(execute).toHaveBeenCalledTimes(1)
      const [ops] = execute.mock.calls[0]
      expect(ops[0].set[path].rows).toHaveLength(2)
      expect(ops[0].set[path].columnHeaders).toHaveLength(3)
    },
  )
})

// A richTable used as an array MEMBER (not a field) can also be deeply nested.
// There the object already owns its `_key`/`_type`, so init must go through the
// relative `onChange` only — never the document-operations `set` at the keyed
// path, which would replace the item wholesale and strip `_key`/`_type`.
describe('InitialiseTable – deeply nested array member (preserves _key/_type)', () => {
  it('patches only the table fields via onChange for a deeply nested keyed member', () => {
    const {onChange, execute} = renderPicker({
      isInArray: true,
      path: 'pageBuilder[_key=="abc"].tables[_key=="t1"]',
    })

    commit(2, 3)

    // Never the document-operations set that would drop the item's _key/_type.
    expect(execute).not.toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledTimes(1)
    const {patches} = onChange.mock.calls[0][0]

    // setIfMissing [] {} keeps the existing keyed item; no destructive set at [].
    expect(patches.some((p: {type: string}) => p.type === 'setIfMissing')).toBe(true)
    const destructiveClear = patches.find(
      (p: {type: string; path: unknown[]}) => p.type === 'set' && p.path.length === 0,
    )
    expect(destructiveClear).toBeUndefined()

    // Fields are set with RELATIVE paths (rows/columnHeaders/…), not the absolute path.
    const byField = (field: string) =>
      patches.find((p: {type: string; path: unknown[]}) => p.type === 'set' && p.path[0] === field)
    expect(byField('rows').value).toHaveLength(2)
    expect(byField('columnHeaders').value).toHaveLength(3)
  })
})

// Releasing a drag fires BOTH the Card's synthetic `onMouseUp` and the
// window-level `mouseup` fallback within a SINGLE native dispatch — before React
// re-renders, so both handlers still observe `dragging === true`. Without the
// synchronous `dragCommittedRef` guard the table is committed twice (a partial
// undo could then leave a mismatched grid); this locks in exactly-once.
describe('InitialiseTable – drag commit (double-fire guard)', () => {
  it('commits a drag exactly once when the Card and window mouseup both fire', () => {
    const {onChange, execute} = renderPicker({isInPortableText: true})
    const cell = screen.getByLabelText('Select 2 rows by 2 columns')

    // Start the drag on the target cell (sets `dragging` and hover = 2×2)…
    fireEvent.mouseDown(cell)
    // …then release. This one event bubbles cell → Card (React synthetic
    // `onMouseUp`) → window (native fallback listener), invoking `endDrag` twice
    // in the same dispatch — exactly the real-browser double-fire.
    fireEvent.mouseUp(cell)
    // An explicit window release too, mirroring a release outside the component.
    fireEvent.mouseUp(window)

    // Portable Text path commits through `onChange`; the ref guard => one commit.
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(execute).not.toHaveBeenCalled()

    const {patches} = onChange.mock.calls[0][0]
    const byField = (field: string) =>
      patches.find((p: {type: string; path: unknown[]}) => p.type === 'set' && p.path[0] === field)
    expect(byField('rows').value).toHaveLength(2)
    expect(byField('columnHeaders').value).toHaveLength(2)
  })
})
