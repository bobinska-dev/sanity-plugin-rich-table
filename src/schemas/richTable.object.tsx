import {ComponentType} from 'react'
import {TbTable} from 'react-icons/tb'
import {
  defineArrayMember,
  defineField,
  defineType,
  ObjectInputProps,
  ObjectItem,
  type ObjectItemProps,
} from 'sanity'

import RichTableBock from '../components/RichTableBock'
import RichTableDiff from '../components/RichTableDiff'
import RichTableInput from '../components/RichTableInput'
import RichTableItem from '../components/RichTableItem'
import {ColumnHeader} from './columnHeader.object'
import {RichTableRowType} from './row.object'

export interface RichTableType {
  rows: Array<RichTableRowType> | undefined
  columnHeaders?: Array<ColumnHeader & ObjectItem>
  hasColumnTitles?: boolean
  hasRowTitles?: boolean
}

export default defineType({
  name: 'richTable',
  title: 'Rich Table',
  type: 'object',
  icon: TbTable,
  components: {
    input: RichTableInput as ComponentType<ObjectInputProps>,
    block: RichTableBock,
    item: RichTableItem as ComponentType<ObjectItemProps<ObjectItem>>,
    // Renders a readable table diff in the "Review changes" pane. `richTableBlock`
    // (type: 'richTable') inherits this via schema-type resolution.
    diff: RichTableDiff,
  },
  fields: [
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      validation: (Rule) => Rule.min(1).error('A table must have at least one row.').required(),
      of: [
        // Reference the top-level `row` type by name only. Giving the member a
        // `name` that differs from a registered top-level type makes it an
        // anonymous inline object, which `sanity graphql deploy` rejects (SYS-141).
        defineArrayMember({
          type: 'row',
        }),
      ],
    }),
    defineField({
      name: 'columnHeaders',
      title: 'Column Headers',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'columnHeader',
          type: 'columnHeader',
        }),
      ],
    }),
    defineField({
      name: 'hasColumnTitles',
      title: 'Has Column Titles',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'hasRowTitles',
      title: 'Has Row Titles',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    prepare: () => ({
      title: 'Rich Table',
      icon: TbTable,
    }),
  },
})
