import {defineArrayMember, defineField, defineType, ObjectItem, PortableTextBlock} from 'sanity'

type ArrayMember = ReturnType<typeof defineArrayMember>

export interface RichTableCellType extends ObjectItem {
  content: Array<PortableTextBlock>
}

export interface CellContentSchema {
  type: 'array'
  of: ArrayMember[]
}

/**
 * Create cell object with default block-only content
 */
export function createCellObject() {
  return defineType({
    name: 'richTableCell',
    title: 'Rich Table Cell',
    type: 'object',
    fields: [
      defineField({
        name: 'content',
        title: 'Content',
        type: 'array',
        of: [defineArrayMember({type: 'block', title: 'Block'})],
      }),
    ],
  })
}

/**
 * Create cell object with inline schema definition
 */
export function createCellObjectWithSchema(schema: CellContentSchema) {
  return defineType({
    name: 'richTableCell',
    title: 'Rich Table Cell',
    type: 'object',
    fields: [
      defineField({
        name: 'content',
        title: 'Content',
        type: schema.type,
        of: schema.of,
      }),
    ],
  })
}

/**
 * Create cell object referencing an existing schema type by name
 */
export function createCellObjectWithTypeName(typeName: string) {
  return defineType({
    name: 'richTableCell',
    title: 'Rich Table Cell',
    type: 'object',
    fields: [
      defineField({
        name: 'content',
        title: 'Content',
        type: typeName,
      }),
    ],
  })
}

export default createCellObject()
