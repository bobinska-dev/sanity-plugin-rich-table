import type {ArraySchemaType, PortableTextBlock} from 'sanity'

/**
 * Resolve the compiled Portable Text **array** type for a table cell's content
 * from the cell's own `content` field schema — the first node in the schema's
 * `.type` chain that carries an `of` (the array members).
 *
 * This is the schema every cell should render from: `defineCellObject` sets the
 * cell's `content` field type to `portableTextSchemaTypeName || 'content'`, so it
 * is always correct **regardless of how the surrounding `richTable` /
 * `richTableBlock` member is named**.
 *
 * Deriving from it — rather than a `portableTextSchemaTypeName` prop threaded
 * through `components.input` — is robust to Sanity dropping `components.input`
 * on a **renamed** Portable Text array member
 * (`defineArrayMember({name: 'richTable', type: 'richTableBlock'})`), which
 * otherwise left the cell with the default schema (SYS-192).
 *
 * The chain walk (rather than a fixed number of `.type` hops) tolerates the
 * different shapes the cell's content field can arrive as — the field descriptor
 * (`{type: arrayType}`), the resolved array type directly, or a deeper wrapper —
 * and is guarded against a self-referential compiled chain.
 */
export function resolveCellContentSchemaType(
  schemaType: unknown,
): ArraySchemaType<PortableTextBlock> | undefined {
  let current = schemaType as {of?: unknown; type?: unknown} | undefined
  const seen = new Set<unknown>()
  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current)
    if (Array.isArray(current.of)) return current as ArraySchemaType<PortableTextBlock>
    current = current.type as {of?: unknown; type?: unknown} | undefined
  }
  return undefined
}
