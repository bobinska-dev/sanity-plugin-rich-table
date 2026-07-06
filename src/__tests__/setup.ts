import '@testing-library/jest-dom/vitest'

// jsdom has no `matchMedia`; @sanity/ui's Popover/Menu (used by the context
// menus) reads it via `usePrefersReducedMotion`. Provide a no-match stub so
// components that open a popover can be rendered in tests.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  const noop = () => undefined
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: noop,
    removeEventListener: noop,
    addListener: noop,
    removeListener: noop,
    dispatchEvent: () => false,
  })
}
