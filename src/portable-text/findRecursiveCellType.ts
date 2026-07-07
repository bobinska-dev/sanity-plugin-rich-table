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
 * Guard against an infinitely recursive cell schema.
 *
 * If the Portable Text type passed as `portableTextSchemaTypeName` (used for the
 * content of every table cell) includes a rich table among its array members,
 * then a cell can contain a table whose cells can contain tables… — an
 * unbounded nesting that makes Sanity's schema normalization
 * (`normalizeMaxDepth` → `resolveSearchConfig`) overflow the call stack
 * ("Maximum call stack size exceeded").
 *
 * Returns the offending member's type name (e.g. `richTableBlock`) so the caller
 * can throw a clear error, or `undefined` when the configuration is safe. Only
 * the direct `of` members of the cell-content array are inspected — the
 * supported way to add a table block — and each member's own inheritance chain,
 * so this check is itself finite and never recurses into the table's fields.
 */
export function findRecursiveCellType(
  schema: SchemaLike,
  portableTextSchemaTypeName?: string,
): string | undefined {
  if (!portableTextSchemaTypeName) return undefined

  const arrayType = schema.get(portableTextSchemaTypeName) as {of?: unknown[]} | undefined
  const members = Array.isArray(arrayType?.of) ? arrayType.of : []

  for (const member of members) {
    if (extendsType(member, RICH_TABLE_TYPE)) {
      return (member as {name?: string}).name ?? RICH_TABLE_TYPE
    }
  }
  return undefined
}
