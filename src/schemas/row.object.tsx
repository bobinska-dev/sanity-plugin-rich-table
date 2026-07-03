import {defineField, defineType, ObjectItem} from 'sanity'

import {RichTableCellType} from './cell.object'

export type RichTableRowType = ObjectItem & {
  title?: string
  cells?: Array<RichTableCellType>
}

export default defineType({
  // NOTE: keep this named `row` (not a namespaced name like `richTableRow`).
  // Rows are written to content with `_type: 'row'` (see InitialiseTable/
  // RowContextMenu/useAddRow), and `sanity graphql deploy` requires every
  // array-member `_type` to match a registered top-level type. Registering under
  // the already-stored `_type` keeps deploy working with no content migration.
  // A namespaced rename would still deploy fine ONLY if the stored `_type` is
  // changed to match it too — which requires migrating existing content. SYS-141.
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
