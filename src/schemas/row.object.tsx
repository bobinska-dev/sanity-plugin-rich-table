import {defineArrayMember, defineField, defineType, ObjectItem} from 'sanity'

import {RichTableCellType} from './cell.object'

export type RichTableRowType = ObjectItem & {
  title?: string
  cells?: Array<RichTableCellType>
}

export default defineType({
  // Named `row` (not `richTableRow`) so it matches the `_type: 'row'` written to
  // content (see InitialiseTable / RowContextMenu) — a stored array-member `_type`
  // must resolve to a registered top-level type or GraphQL deploy fails (SYS-141).
  name: 'row',
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
