import {RICH_TABLE_BLOCK_TYPE} from './toRichTableValue'

/**
 * Auto-detect the name under which the rich-table block is registered in the
 * CURRENT Portable Text field, so paste-to-import can insert a block whose
 * `_type` matches the consumer's member — **without asking them to pass it**.
 *
 * A consumer may register the block under any alias to keep a stable stored
 * `_type` (`defineArrayMember({name: 'richTable', type: 'richTableBlock'})`),
 * and the inserted block's `_type` must equal that alias to render. We resolve
 * it by the block's UNDERLYING STRUCTURE, not a hard-coded name: the field's
 * block object whose fields include both `rows` and `columnHeaders` — the
 * rich-table signature — is the table, whatever it's named.
 *
 * Reads the editor's field-scoped schema (`snapshot.context.schema.blockObjects`
 * — the same array `commands.ts` iterates). Falls back to the default
 * `richTableBlock` name when the table block can't be identified structurally
 * (e.g. an un-renamed member, or a schema shape that doesn't expose fields).
 */
export function resolveRichTableBlockName(schema: unknown): string {
  const blockObjects = (
    schema as {
      blockObjects?: ReadonlyArray<{name?: string; fields?: ReadonlyArray<{name?: string}>}>
    }
  )?.blockObjects

  const list = Array.isArray(blockObjects) ? blockObjects : []
  const table = list.find((blockObject) => {
    const fields = Array.isArray(blockObject?.fields) ? blockObject.fields : []
    const fieldNames = fields.map((field: {name?: string}) => field?.name)
    return fieldNames.includes('rows') && fieldNames.includes('columnHeaders')
  })

  return table?.name ?? RICH_TABLE_BLOCK_TYPE
}
