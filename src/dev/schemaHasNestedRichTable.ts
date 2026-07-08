import {RICH_TABLE_TYPE} from '../portable-text/findRecursiveCellType'
import {extendsType} from '../portable-text/schemaTypeChain'

interface SchemaLike {
  getTypeNames?: () => string[]
  get: (typeName: string) => unknown
}

/** Whether `node`, or anything nested in its arrays (`of`) / object fields, is a rich table. */
function subtreeHasRichTable(node: unknown, seen: Set<unknown>): boolean {
  if (!node || typeof node !== 'object' || seen.has(node)) return false
  seen.add(node)
  if (extendsType(node, RICH_TABLE_TYPE)) return true
  const {of, fields, type} = node as {
    of?: unknown
    fields?: Array<{type?: unknown}>
    type?: unknown
  }
  if (Array.isArray(of) && of.some((member) => subtreeHasRichTable(member, seen))) return true
  if (Array.isArray(fields) && fields.some((field) => subtreeHasRichTable(field?.type, seen))) {
    return true
  }
  return subtreeHasRichTable(type, seen)
}

/** A Portable Text array = an array whose members include a `block`. */
function isPortableTextArray(node: unknown): boolean {
  const of = (node as {of?: unknown})?.of
  return Array.isArray(of) && of.some((member) => extendsType(member, 'block'))
}

/**
 * Whether this Studio's schema places a rich table inside a Portable Text field
 * — i.e. a Portable Text array whose members include (or nest) a rich table.
 *
 * That is the ONLY shape that makes a cell `@portabletext/editor` render nested
 * inside a body `@portabletext/editor`, which is what triggers the dev-only
 * react-compiler-runtime corruption. We use it to scope
 * {@link installCompilerRuntimeHint}: without this nesting, the hint would never
 * be relevant, so it isn't installed at all (no `console.error` patch shipped to
 * Studios that don't use the feature, and no chance of misdiagnosing an
 * unrelated `useMemoCache` warning).
 *
 * A cell's own content array is also a Portable Text array, but it can't contain
 * a table (that recursion is rejected at load by `findRecursiveCellType`), so it
 * never trips this. Traversal is finite via a visited set.
 */
export function schemaHasNestedRichTable(schema: SchemaLike): boolean {
  const typeNames = schema.getTypeNames?.() ?? []
  const seen = new Set<unknown>()
  const stack: unknown[] = typeNames.map((name) => schema.get(name)).filter(Boolean)

  while (stack.length) {
    const node = stack.pop()
    if (!node || typeof node !== 'object' || seen.has(node)) continue
    seen.add(node)

    if (isPortableTextArray(node)) {
      const of = (node as {of: unknown[]}).of
      // A fresh visited set per member so one member's subtree doesn't mask another's.
      if (of.some((member) => subtreeHasRichTable(member, new Set()))) return true
    }

    const {of, fields, type} = node as {
      of?: unknown
      fields?: Array<{type?: unknown}>
      type?: unknown
    }
    if (Array.isArray(of)) stack.push(...of)
    if (Array.isArray(fields)) stack.push(...fields.map((field) => field?.type))
    if (type) stack.push(type)
  }
  return false
}
