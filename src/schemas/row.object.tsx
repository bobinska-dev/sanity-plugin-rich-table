import {defineArrayMember, defineField, defineType, ObjectItem} from 'sanity'

import {RichTableCellType} from './cell.object'

export type RichTableRowType = ObjectItem & {
  title?: string
  cells?: Array<RichTableCellType>
}

export default defineType({
  name: 'richTableRow',
  title: 'Rich Table Row',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Optional title for the row.',
    }),
    defineField({
      name: 'cells',
      title: 'Cells',
      type: 'array',
      of: [defineArrayMember({type: 'richTableCell'})],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      cells: 'cells',
    },
    prepare(selection) {
      const {title, cells} = selection
      if (!title) {
        return {
          title: 'Row',
          subtitle: `${cells.length} cell${cells && cells.length === 1 ? '' : 's'}`,
        }
      }
      return {
        title: title,
        subtitle: `${cells.length} cell${cells && cells.length === 1 ? '' : 's'}`,
      }
    },
  },
})
