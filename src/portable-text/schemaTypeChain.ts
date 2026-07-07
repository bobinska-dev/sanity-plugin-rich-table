/**
 * Walk a compiled schema type's `.type` inheritance chain looking for a base
 * type name (e.g. `image`, `richTable`).
 *
 * Sanity array members can be **named** — `defineArrayMember({type: 'image',
 * name: 'imageWithCaption'})` or `richTableBlock` (`type: 'richTable'`) — so
 * routing on the exact `name` misses them and sends them down the wrong path
 * (e.g. a named image falling through to the default block renderer, which then
 * tries to render the asset object and crashes). Match the base type instead.
 *
 * Guards against a self-referential compiled chain.
 */
export function extendsType(type: unknown, baseTypeName: string): boolean {
  let current = type as {name?: string; type?: unknown} | undefined
  const seen = new Set<unknown>()
  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current)
    if (current.name === baseTypeName) return true
    current = current.type as {name?: string; type?: unknown} | undefined
  }
  return false
}
