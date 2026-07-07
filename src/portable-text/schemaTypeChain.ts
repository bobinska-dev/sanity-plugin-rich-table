/** A compiled schema node as far as chain-walking cares: it may carry a `name`,
 * an `of` (array members), and a `type` (the next link in the inheritance chain). */
type ChainNode = {name?: string; of?: unknown; type?: unknown}

/**
 * Walk a compiled schema type's `.type` inheritance chain, returning the first
 * non-`undefined` value `predicate` yields for a node — or `undefined` if the
 * chain is exhausted.
 *
 * Sanity array members can be **named** (`defineArrayMember({type: 'image',
 * name: 'imageWithCaption'})`, `richTableBlock` from `type: 'richTable'`), so the
 * base type sits one or more `.type` hops up from the node you're handed. Walking
 * the chain (rather than a fixed number of hops) tolerates the different shapes a
 * node can arrive as. Guards against a self-referential compiled chain.
 */
export function findInTypeChain<T>(
  type: unknown,
  predicate: (node: ChainNode) => T | undefined,
): T | undefined {
  let current = type as ChainNode | undefined
  const seen = new Set<unknown>()
  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current)
    const found = predicate(current)
    if (found !== undefined) return found
    current = current.type as ChainNode | undefined
  }
  return undefined
}

/**
 * Whether a compiled schema type extends `baseTypeName` anywhere in its `.type`
 * chain — so a named member (`imageWithCaption` over `image`) still routes on its
 * base type instead of falling through to the default block renderer, which would
 * try to render the asset object and crash.
 */
export function extendsType(type: unknown, baseTypeName: string): boolean {
  return findInTypeChain(type, (node) => (node.name === baseTypeName ? true : undefined)) ?? false
}
