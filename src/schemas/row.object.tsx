import {defineField, defineType, ObjectItem} from 'sanity'

import {RichTableCellType} from './cell.object'

export type RichTableRowType = ObjectItem & {
  title?: string
  cells?: Array<RichTableCellType>
}

export default defineType({
  // NOTE: keep this named `row` (not `richTableRow`). Rows are written to content
  // with `_type: 'row'` (see InitialiseTable/RowContextMenu/useAddRow), and the
  // `rows` array member in richTable.object references `type: 'row'`. The GraphQL
  // API requires every array-member type to be a registered top-level type, so
  // the registered name MUST match the stored `_type`. Renaming this to a
  // namespaced value would break `sanity graphql deploy` (anonymous inline type)
  // and orphan existing content. See SYS-141.
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
      of: [
        defineType({
          name: 'richTableCell',
          title: 'Cell',
          type: 'richTableCell',
        }),
      ],
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
