import {cleanup, render} from '@testing-library/react'
import {createRef} from 'react'
import type {PortableTextBlock} from 'sanity'
import {afterEach, describe, expect, it, vi} from 'vitest'

// Mock only `useEditor` so we can observe what SyncExternalValue sends without
// mounting a real EditorProvider (the point of the test is the focus/mount guard
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
    const focusedRef = createRef<boolean>() as {current: boolean}
    focusedRef.current = false
    render(<SyncExternalValue value={[block('a')]} focusedRef={focusedRef} />)
    expect(send).not.toHaveBeenCalled()
  })

  it('pushes an external value change while the cell is NOT focused', () => {
    const focusedRef = {current: false}
    const {rerender} = render(<SyncExternalValue value={[block('a')]} focusedRef={focusedRef} />)
    const next = [block('external edit')]
    rerender(<SyncExternalValue value={next} focusedRef={focusedRef} />)
    expect(send).toHaveBeenCalledTimes(1)
    expect(send).toHaveBeenCalledWith({type: 'update value', value: next})
  })

  it('does NOT push while the cell is focused (never resets the user’s typing)', () => {
    const focusedRef = {current: true}
    const {rerender} = render(<SyncExternalValue value={[block('a')]} focusedRef={focusedRef} />)
    rerender(<SyncExternalValue value={[block('user is typing')]} focusedRef={focusedRef} />)
    expect(send).not.toHaveBeenCalled()
  })
})
