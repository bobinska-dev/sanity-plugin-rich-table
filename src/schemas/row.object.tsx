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
      // Guard: a row may have no `cells` yet (freshly inserted / cleared).
      const count = Array.isArray(cells) ? cells.length : 0
      return {
        title: title || 'Row',
        subtitle: `${count} cell${count === 1 ? '' : 's'}`,
      }
    },
  },
})
