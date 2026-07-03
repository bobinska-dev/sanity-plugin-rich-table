import {defineField, defineType, ObjectItem} from 'sanity'

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
      // `cells` can be undefined (empty/legacy rows, or partial values in the
      // "Review changes" diff view), so guard before reading `.length` — an
      // exception here would blank the preview and the diff.
      const cellCount = Array.isArray(cells) ? cells.length : 0
      return {
        title: title || 'Row',
        subtitle: `${cellCount} cell${cellCount === 1 ? '' : 's'}`,
      }
    },
  },
})
