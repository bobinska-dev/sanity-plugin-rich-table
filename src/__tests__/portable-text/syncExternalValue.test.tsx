import {cleanup, render} from '@testing-library/react'
import type {PortableTextBlock} from 'sanity'
import {afterEach, describe, expect, it, vi} from 'vitest'

// Mock only `useEditor` so we can observe what SyncExternalValue sends without
// mounting a real EditorProvider (the point of the test is the focus/sync guard
// logic). The rest of the module is preserved so its other importers still load.
const send = vi.fn()
vi.mock('@portabletext/editor', async (importActual) => {
  const actual = await importActual<typeof import('@portabletext/editor')>()
  return {...actual, useEditor: () => ({send})}
})

import {SyncExternalValue} from '../../portable-text/ContentPortableTextEditor'

const block = (text: string): PortableTextBlock =>
  ({
    _type: 'block',
    _key: 'k',
    children: [{_type: 'span', _key: 's', text}],
  }) as unknown as PortableTextBlock

afterEach(() => {
  send.mockClear()
  cleanup()
})

describe('SyncExternalValue', () => {
  it('does not push on the initial mount (initialConfig already seeded it)', () => {
    render(<SyncExternalValue value={[block('a')]} focused={false} />)
    expect(send).not.toHaveBeenCalled()
  })

  it('pushes an external value change while the cell is NOT focused', () => {
    const {rerender} = render(<SyncExternalValue value={[block('a')]} focused={false} />)
    const next = [block('external edit')]
    rerender(<SyncExternalValue value={next} focused={false} />)
    expect(send).toHaveBeenCalledTimes(1)
    expect(send).toHaveBeenCalledWith({type: 'update value', value: next})
  })

  it('does NOT push while the cell is focused (never resets the user’s typing)', () => {
    const {rerender} = render(<SyncExternalValue value={[block('a')]} focused />)
    rerender(<SyncExternalValue value={[block('user is typing')]} focused />)
    expect(send).not.toHaveBeenCalled()
  })

  it('flushes on blur an external change that arrived while focused', () => {
    // External change lands while the cell is focused → skipped. It must be applied
    // on blur, not left stale until some unrelated later change.
    const {rerender} = render(<SyncExternalValue value={[block('a')]} focused />)
    const external = [block('collaborator edit')]
    rerender(<SyncExternalValue value={external} focused />) // arrives while focused → skipped
    expect(send).not.toHaveBeenCalled()
    rerender(<SyncExternalValue value={external} focused={false} />) // blur, same value ref
    expect(send).toHaveBeenCalledTimes(1)
    expect(send).toHaveBeenCalledWith({type: 'update value', value: external})
  })

  it('does not revert an in-flight local edit on blur (value not yet round-tripped)', () => {
    // User types, then blurs before the edit's patch round-trips: `value` is still
    // the pre-edit reference. Because we compare against the last-synced value (not
    // the editor's live state), an unchanged `value` on blur must NOT be re-pushed
    // — pushing it would revert the just-typed characters.
    const seeded = [block('a')]
    const {rerender} = render(<SyncExternalValue value={seeded} focused />)
    rerender(<SyncExternalValue value={seeded} focused={false} />) // blur, value ref unchanged
    expect(send).not.toHaveBeenCalled()
  })
})
