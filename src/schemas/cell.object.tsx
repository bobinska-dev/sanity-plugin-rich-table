import {defineArrayMember, defineField, defineType, ObjectItem, PortableTextBlock} from 'sanity'

type ArrayMember = ReturnType<typeof defineArrayMember>

export interface RichTableCellType extends ObjectItem {
  content: Array<PortableTextBlock>
}

export function createCellObject(
  additionalMembers?: ArrayMember[],
  blockOverrides?: Record<string, unknown>,
) {
  const blockMember = blockOverrides
    ? defineArrayMember({type: 'block', title: 'Block', ...blockOverrides})
    : defineArrayMember({type: 'block', title: 'Block'})

  return defineType({
    name: 'richTableCell',
    title: 'Rich Table Cell',
    type: 'object',
    fields: [
      defineField({
        name: 'content',
        title: 'Content',
        type: 'array',
        of: [blockMember, ...(additionalMembers ?? [])],
      }),
    ],
  })
}

export function createCellObjectWithType(contentTypeName: string) {
  return defineType({
    name: 'richTableCell',
    title: 'Rich Table Cell',
    type: 'object',
    fields: [
      defineField({
        name: 'content',
        title: 'Content',
        type: contentTypeName,
      }),
    ],
  })
}

export default createCellObject()
