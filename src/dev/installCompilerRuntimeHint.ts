// React logs this (via `console.error`) from react-dom when `useMemoCache` is
// called with a cache size that differs from the previous render — the tell-tale
// symptom of the dev-only React-Compiler-runtime corruption that hits a
// `@portabletext/editor` nested inside another one (a rich table inside a
// Portable Text field). React's own message is opaque, so we watch for it and
// emit ONE actionable follow-up pointing at the fix.
const REACT_USE_MEMO_CACHE_MISMATCH =
  'Expected a constant size argument for each invocation of useMemoCache'

// Marks our wrapper so repeated installs (HMR, StrictMode remounts, multiple
// plugin instances) never stack another layer of `console.error`.
const INSTALLED_FLAG = '__sanityRichTableCompilerHintInstalled'

// Once per session — the underlying error spams on every render.
let hinted = false

type PatchableConsoleError = typeof console.error & {[INSTALLED_FLAG]?: boolean}

const HINT = [
  '[sanity-plugin-rich-table] React "useMemoCache" size-mismatch detected (dev only).',
  '',
  'This Studio nests a rich table inside a Portable Text field, so a @portabletext/editor',
  "renders inside another one. In `sanity dev`, that MAY be caused by @sanity/ui's",
  "`react-compiler-runtime` shim swapping React's global dispatcher and corrupting the",
  "inner cell editor's hooks — a symptom is cells rendering as `[type: _key]` placeholders.",
  '`sanity build` / production is unaffected.',
  '',
  'If you see that, fix it in sanity.cli.ts:',
  '  vite: {',
  "    resolve: {alias: [{find: /^react-compiler-runtime$/, replacement: 'react/compiler-runtime'}]},",
  "    optimizeDeps: {exclude: ['react-compiler-runtime']},",
  '  }',
  '',
  'Other possible cause: a duplicated React — dedupe to a single react@19 (e.g. pnpm overrides).',
  'Disable this hint with `richTablePlugin({devConsoleHint: false})`.',
  '',
  'Details: https://github.com/bobinska-dev/sanity-plugin-rich-table#compatibility',
].join('\n')

/**
 * Install a dev-only `console.error` interceptor that, the first time React's
 * `useMemoCache` size-mismatch warning fires, prints one actionable hint about
 * the nested-editor React-Compiler-runtime issue and how to fix it.
 *
 * No-op in production, outside the browser, or if already installed. Returns a
 * cleanup that restores the original `console.error` (only if nothing patched on
 * top of ours in the meantime). Safe to call from a mount effect.
 */
export function installCompilerRuntimeHint(): () => void {
  const noop = () => undefined
  if (process.env.NODE_ENV === 'production') return noop
  if (typeof window === 'undefined' || typeof console === 'undefined') return noop

  const current = console.error as PatchableConsoleError
  if (current[INSTALLED_FLAG]) return noop

  const original = console.error
  const patched: PatchableConsoleError = (...args: Parameters<typeof console.error>) => {
    // Always pass the original error through untouched.
    original.apply(console, args)
    if (hinted) return
    const first = args[0]
    if (typeof first === 'string' && first.includes(REACT_USE_MEMO_CACHE_MISMATCH)) {
      hinted = true
      // Use `original` so this hint is never re-matched by our own wrapper.
      original.call(console, HINT)
    }
  }
  patched[INSTALLED_FLAG] = true
  console.error = patched

  return () => {
    if (console.error === patched) console.error = original
  }
}
