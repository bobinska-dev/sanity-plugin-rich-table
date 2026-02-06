import {defineField, defineType, ObjectItem, PortableTextBlock} from 'sanity'
import {Button, Stack} from '@sanity/ui'
import {useDocumentPane} from 'sanity/structure'
import {CloseIcon} from '@sanity/icons'

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
