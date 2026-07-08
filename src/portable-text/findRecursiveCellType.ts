import {extendsType} from './schemaTypeChain'

/**
 * The registered schema type name for a rich table. `richTableBlock` and any
 * custom block object the consumer declares with `type: 'richTable'` both
 * inherit from this, so a member "is a table" iff `richTable` appears anywhere
 * in its type-inheritance chain.
 */
export const RICH_TABLE_TYPE = 'richTable'

interface SchemaLike {
  get(typeName: string): unknown
}

/**
 * Whether `node` — or anything nested inside its arrays (`of`) or object fields
 * — is a rich table. Catches both DIRECT recursion (a `richTableBlock` in the
 * cell content array) and INDIRECT recursion (e.g. a `callout` block object
 * whose own body PT array contains a `richTableBlock`), both of which overflow
 * Sanity's schema normalization. A visited set makes it finite even on a
 * legitimately-cyclic compiled schema.
 *
 * Shared with {@link schemaHasNestedRichTable} (the dev-hint gate), so the
 * "does this subtree contain a table" walk lives in one place.
 */
export function containsRichTable(node: unknown, seen: Set<unknown>): boolean {
  if (!node || typeof node !== 'object' || seen.has(node)) return false
  seen.add(node)

  if (extendsType(node, RICH_TABLE_TYPE)) return true

  const {of, fields, type} = node as {
    of?: unknown
    fields?: Array<{type?: unknown}>
    type?: unknown
  }
  if (Array.isArray(of) && of.some((member) => containsRichTable(member, seen))) return true
  if (Array.isArray(fields) && fields.some((field) => containsRichTable(field?.type, seen))) {
    return true
  }
  return containsRichTable(type, seen)
}

/**
 * Guard against an infinitely recursive cell schema.
 *
 * If the Portable Text type passed as `portableTextSchemaTypeName` (used for the
 * content of every table cell) includes a rich table — directly among its array
 * members, OR nested inside one of those members (a custom block object whose
 * body embeds a table) — then a cell can contain a table whose cells can contain
 * tables… — unbounded nesting that makes Sanity's schema normalization
 * (`normalizeMaxDepth` → `resolveSearchConfig`) overflow the call stack
 * ("Maximum call stack size exceeded").
 *
 * Returns the offending top-level member's name so the caller can throw a clear
 * error, or `undefined` when the configuration is safe. Detection walks each
 * member's nested arrays/fields (with a visited set) so indirect cycles are
 * caught too, not just a table placed directly in the cell content.
 */
export function findRecursiveCellType(
  schema: SchemaLike,
  portableTextSchemaTypeName?: string,
): string | undefined {
  if (!portableTextSchemaTypeName) return undefined

  const arrayType = schema.get(portableTextSchemaTypeName) as {of?: unknown[]} | undefined
  const members = Array.isArray(arrayType?.of) ? arrayType.of : []

  for (const member of members) {
    // A fresh visited set per member keeps the reported name tied to the
    // top-level cell member that introduces the cycle.
    if (containsRichTable(member, new Set())) {
      return (member as {name?: string}).name ?? RICH_TABLE_TYPE
    }
  }
  return undefined
}
