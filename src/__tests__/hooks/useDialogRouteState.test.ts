import {act, renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

// vi.mock is hoisted above imports, so the mock object must be created with
// vi.hoisted to be referenceable inside the factory.
const {mockPaneRouter} = vi.hoisted(() => ({
  mockPaneRouter: {
    params: {} as Record<string, string | undefined>,
    routerPanesState: [] as unknown[],
    setParams: vi.fn(),
  },
}))

vi.mock('sanity/structure', () => ({
  usePaneRouter: () => mockPaneRouter,
}))

import {useDialogRouteState} from '../../hooks/useDialogRouteState'

// A realistic field path containing the pane-string grammar's own delimiters (=, [, ], ").
const PATH = 'rows[_key=="r1"].content'
const ENCODED = encodeURIComponent(PATH)

// A non-empty routerPanesState signals a real PaneRouterContext provider (Structure tool).
const inStructure = () => {
  mockPaneRouter.routerPanesState = [[{id: 'doc'}]]
}

describe('useDialogRouteState', () => {
  beforeEach(() => {
    mockPaneRouter.params = {}
    mockPaneRouter.routerPanesState = []
    mockPaneRouter.setParams = vi.fn()
  })

  it('encodes the path so it survives the URL round-trip', () => {
    // the raw path contains grammar delimiters; the encoded form must not
    expect(PATH).toMatch(/[=[\]"]/)
    expect(ENCODED).not.toMatch(/[=[\]",;|]/)
  })

  it('is closed inside Structure when no matching param is present', () => {
    inStructure()
    const {result} = renderHook(() => useDialogRouteState(PATH))
    expect(result.current.open).toBe(false)
  })

  it('is open inside Structure when the param matches the encoded path', () => {
    inStructure()
    mockPaneRouter.params = {richTableExpand: ENCODED}
    const {result} = renderHook(() => useDialogRouteState(PATH))
    expect(result.current.open).toBe(true)
  })

  it('writes the encoded path and preserves existing params when opening', () => {
    inStructure()
    mockPaneRouter.params = {view: 'preview'}
    const {result} = renderHook(() => useDialogRouteState(PATH))

    act(() => result.current.handleOpen())

    expect(mockPaneRouter.setParams).toHaveBeenCalledWith({
      view: 'preview',
      richTableExpand: ENCODED,
    })
  })

  it('clears only its own param when closing, preserving others', () => {
    inStructure()
    mockPaneRouter.params = {view: 'preview', richTableExpand: ENCODED}
    const {result} = renderHook(() => useDialogRouteState(PATH))

    act(() => result.current.handleClose())

    expect(mockPaneRouter.setParams).toHaveBeenCalledWith({
      view: 'preview',
      richTableExpand: undefined,
    })
  })

  it('stays closed when another table field owns the param (disambiguation)', () => {
    inStructure()
    mockPaneRouter.params = {richTableExpand: encodeURIComponent('rows[_key=="OTHER"].content')}
    const {result} = renderHook(() => useDialogRouteState(PATH))
    expect(result.current.open).toBe(false)
  })

  // Outside the Structure tool routerPanesState is [] (the default context), where
  // setParams would throw "Pane is missing router context".
  it('never calls setParams outside the Structure tool', () => {
    const {result} = renderHook(() => useDialogRouteState(PATH))

    act(() => result.current.handleOpen())
    act(() => result.current.handleClose())

    expect(mockPaneRouter.setParams).not.toHaveBeenCalled()
  })

  it('falls back to local state for open/close outside the Structure tool', () => {
    const {result} = renderHook(() => useDialogRouteState(PATH))
    expect(result.current.open).toBe(false)

    act(() => result.current.handleOpen())
    expect(result.current.open).toBe(true)

    act(() => result.current.handleClose())
    expect(result.current.open).toBe(false)
  })
})
