import {
  ArrayDefinition,
  ArraySchemaType,
  defineField,
  defineType,
  FieldDefinition,
  ObjectItem,
  PortableTextBlock,
} from 'sanity'

/** Stable type name for the rich table cell schema — used wherever the name is referenced as a string. */
export const RICH_TABLE_CELL_TYPE_NAME = 'richTableCell'

export interface RichTableCellType extends ObjectItem {
  content: Array<PortableTextBlock>
}

/**
 * Factory function to create a rich table cell object with a custom content field.
 * Handles building the appropriate content field based on the provided cellContentSchema.
 * @param cellContentSchema - Optional custom portable text schema for cell content
 * @returns A cell object type definition
 */
export default function createCellObject(
  cellContentSchema?: ArraySchemaType<PortableTextBlock> | ArrayDefinition,
): ReturnType<typeof defineType> {
  let contentField: FieldDefinition

  if (cellContentSchema) {
    // If the schema has a registered name, reference it by name so Sanity resolves
    // it from the registry. Otherwise it's an inline ArrayDefinition without a name,
    // so we inline its `of` members directly into a new array field.
    const schemaName = (cellContentSchema as ArraySchemaType<PortableTextBlock>)?.name
    if (schemaName) {
      contentField = defineField({
        name: 'content',
        title: 'Content',
        type: schemaName,
      })
    } else {
      contentField = defineField({
        name: 'content',
        title: 'Content',
        type: 'array',
        of: (cellContentSchema as ArrayDefinition).of || [],
      })
    }
  } else {
    contentField = defineField({
      name: 'content',
      title: 'Content',
      type: 'content',
    })
  }

  return defineType({
    name: RICH_TABLE_CELL_TYPE_NAME,
    title: 'Rich Table Cell',
    type: 'object',
    fields: [contentField],
  })
}
