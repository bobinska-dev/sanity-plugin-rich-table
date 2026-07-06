import type {Path} from 'sanity'

/**
 * Read the value at an absolute document `path` out of a plain value (e.g. the
 * comparison document from `useDocumentPane().comparisonValue`). Handles the
 * segment kinds that appear on a cell content path: object keys (string), array
 * indices (number) and keyed array items (`{_key}`). Returns `undefined` if any
 * step can't be resolved. Never throws.
 */
export function getValueAtPath(root: unknown, path: Path): unknown {
  let current: unknown = root

  for (const segment of path) {
    if (current === null || current === undefined) return undefined

    if (typeof segment === 'string') {
      current = (current as Record<string, unknown>)[segment]
    } else if (typeof segment === 'number') {
      current = Array.isArray(current) ? current[segment] : undefined
    } else if (segment && typeof segment === 'object' && '_key' in segment) {
      const key = (segment as {_key: string})._key
      current = Array.isArray(current)
        ? current.find((item) => (item as {_key?: unknown} | null)?._key === key)
        : undefined
    } else {
      // Index tuples (`[from, to]`) and other exotic segments don't occur on a
      // cell content path; treat them as unresolvable.
      return undefined
    }
  }

  return current
}
