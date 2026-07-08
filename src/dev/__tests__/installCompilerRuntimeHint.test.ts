import {afterEach, describe, expect, it, vi} from 'vitest'

// The exact string react-dom logs (via console.error) on a useMemoCache size
// mismatch — the symptom the hint keys off.
const REACT_WARNING =
  'Expected a constant size argument for each invocation of useMemoCache. ' +
  'The previous cache was allocated with size 1 but size 20 was requested.'

const isHint = (call: unknown[]) =>
  typeof call[0] === 'string' && call[0].includes('[sanity-plugin-rich-table]')

/** Fresh module each test so the module-level `hinted`/install flags reset. */
async function load() {
  vi.resetModules()
  return (await import('../installCompilerRuntimeHint')).installCompilerRuntimeHint
}

describe('installCompilerRuntimeHint', () => {
  const realError = console.error

  afterEach(() => {
    console.error = realError
  })

  it('prints exactly one hint when the useMemoCache warning fires repeatedly', async () => {
    const install = await load()
    const spy = vi.fn()
    console.error = spy as unknown as typeof console.error
    const cleanup = install()

    console.error(REACT_WARNING, 1, 20)
    console.error(REACT_WARNING, 1, 20)

    // Both original warnings pass through untouched…
    expect(spy.mock.calls.filter((c) => c[0] === REACT_WARNING)).toHaveLength(2)
    // …and the hint is emitted once.
    expect(spy.mock.calls.filter(isHint)).toHaveLength(1)
    cleanup()
  })

  it('passes unrelated errors through without hinting', async () => {
    const install = await load()
    const spy = vi.fn()
    console.error = spy as unknown as typeof console.error
    const cleanup = install()

    console.error('some other error')

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls.filter(isHint)).toHaveLength(0)
    cleanup()
  })

  it('does not stack wrappers on repeated installs, and cleanup restores the original', async () => {
    const install = await load()
    const spy = vi.fn()
    console.error = spy as unknown as typeof console.error

    const cleanup1 = install()
    const afterFirst = console.error
    const cleanup2 = install() // no-op: already installed

    expect(console.error).toBe(afterFirst) // not double-wrapped
    cleanup2()
    cleanup1()
    expect(console.error).toBe(spy) // restored to the pre-install error
  })

  it('is a no-op in production', async () => {
    const prev = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    try {
      const install = await load()
      const spy = vi.fn()
      console.error = spy as unknown as typeof console.error
      const cleanup = install()

      expect(console.error).toBe(spy) // never patched
      console.error(REACT_WARNING, 1, 20)
      expect(spy.mock.calls.filter(isHint)).toHaveLength(0)
      cleanup()
    } finally {
      process.env.NODE_ENV = prev
    }
  })
})
