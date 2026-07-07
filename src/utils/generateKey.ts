export function generateKey(length = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = new Uint8Array(length)

  // `globalThis.crypto` works in the browser, Web Workers AND Node (≥18 ships
  // Web Crypto as a global). `self` is undefined server-side, so a custom import
  // pipeline calling the public `toRichTableValue` / `parse*` exports in CI/SSR
  // would otherwise throw `ReferenceError: self is not defined`.
  globalThis.crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}
