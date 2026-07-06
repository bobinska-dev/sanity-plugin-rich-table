import {defineField, defineType, ObjectItem, PortableTextBlock} from 'sanity'

export interface RichTableCellType extends ObjectItem {
  content: Array<PortableTextBlock>
}
export default defineType({
  name: 'richTableCell',
  title: 'Rich Table Cell',
  type: 'object',
  fields: [
    defineField({
      name: 'content',
      title: 'Content',
      type: 'content',
    }),
  ],
})

export const defineCellObject = ({
  portableTextSchemaTypeName,
}: {
  portableTextSchemaTypeName?: string
}) => {
  return defineType({
    name: 'richTableCell',
    title: 'Rich Table Cell',
    type: 'object',
    fields: [
      defineField({
        name: 'content',
        title: 'Content',
        type: portableTextSchemaTypeName || 'content',
      }),
    ],
  })
}
