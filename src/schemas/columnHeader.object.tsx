import {defineField, defineType} from 'sanity'

export interface ColumnHeader {
  title?: string
  /** test to integrate headers with cell keys */
  cellIndex: number
  /** Column width in pixels, set via the header drag handle. Unset columns
   * share the table's remaining width equally. */
  width?: number
}
export default defineType({
  name: 'columnHeader',
  title: 'Column Header',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'cellIndex',
      title: 'Cell Index',
      type: 'number',
      description: 'Index of the cells this header corresponds to.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'width',
      title: 'Width',
      type: 'number',
      description: 'Column width in pixels. Unset columns share the remaining width equally.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'cellIndex',
    },
  },
})
