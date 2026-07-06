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
import RichTableField from '../components/RichTableField'
import RichTableInput from '../components/RichTableInput'
import RichTableItem from '../components/RichTableItem'
import {ColumnHeader} from './columnHeader.object'
import {RichTableRowType} from './row.object'

export interface RichTableType {
  rows: Array<RichTableRowType> | undefined
  columnHeaders?: Array<ColumnHeader & ObjectItem>
  hasColumnTitles?: boolean
  hasRowTitles?: boolean
  /** Row-title column width in pixels, set via the drag handle. Unset lets it
   * fill the remaining width. */
  rowTitleWidth?: number
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
        defineArrayMember({
          name: 'row',
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
    defineField({
      name: 'rowTitleWidth',
      title: 'Row title column width',
      type: 'number',
      description:
        'Width of the row-title column in pixels. Unset lets it fill the remaining width.',
      validation: (Rule) => Rule.positive(),
    }),
  ],
  preview: {
    prepare: () => ({
      title: 'Rich Table',
      icon: TbTable,
    }),
  },
})

export const defineRichTableObject = ({
  portableTextSchemaTypeName,
}: {
  portableTextSchemaTypeName?: string
}) => {
  return defineType({
    name: 'richTable',
    title: 'Rich Table',
    type: 'object',
    icon: TbTable,
    components: {
      input: (inputProps) => (
        <RichTableInput
          {...(inputProps as ObjectInputProps<RichTableType>)}
          portableTextSchemaTypeName={portableTextSchemaTypeName}
        />
      ),
      block: RichTableBock,
      // Mirrors the table's aggregated validation onto the native field header,
      // so the field-title marker matches every other field.
      field: RichTableField,
      // Renders a readable table diff in the "Review changes" pane.
      diff: RichTableDiff,
    },
    fields: [
      defineField({
        name: 'rows',
        title: 'Rows',
        type: 'array',
        validation: (Rule) => Rule.min(1).error('A table must have at least one row.').required(),
        of: [
          defineArrayMember({
            name: 'row',
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
      defineField({
        name: 'rowTitleWidth',
        title: 'Row title column width',
        type: 'number',
        description:
          'Width of the row-title column in pixels. Unset lets it fill the remaining width.',
        validation: (Rule) => Rule.positive(),
      }),
    ],
    preview: {
      prepare: () => ({
        title: 'Rich Table',
        icon: TbTable,
      }),
    },
  })
}
