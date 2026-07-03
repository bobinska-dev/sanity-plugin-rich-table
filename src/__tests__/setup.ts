import '@testing-library/jest-dom/vitest'

// jsdom doesn't implement matchMedia, which @sanity/ui's LayerProvider/PortalProvider
// (used by Dialog) rely on. Provide a minimal no-op implementation for tests.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  const noop = () => undefined
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: noop,
      removeListener: noop,
      addEventListener: noop,
      removeEventListener: noop,
      dispatchEvent: () => false,
    }) as MediaQueryList
}
