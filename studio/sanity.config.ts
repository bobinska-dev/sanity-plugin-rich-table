import {visionTool} from '@sanity/vision'
import {defineArrayMember, defineConfig, defineField, defineType} from 'sanity'

import {AsteriskIcon, ImageIcon} from '@sanity/icons'
import {richTablePlugin} from 'sanity-plugin-rich-table'
import {structureTool} from 'sanity/structure'
import CustomBock from './components/CustomBock'
import TestBlock from './TestBlock'

export default defineConfig({
  name: 'default',
  title: 'Sanity Dev Studio',

  projectId: 'xonzamf8',
  dataset: 'production',

  plugins: [
    structureTool(),
    visionTool(),
    richTablePlugin({
      portableTextSchemaTypeName: 'customPT',
    }),
  ],

  schema: {
    types: [
      defineType({
        type: 'document',
        name: 'myRichTableDocument',
        title: 'My Rich Table Document',
        fields: [
          defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
          }),
          defineField({
            name: 'myRichTable',
            title: 'My Rich Table',
            type: 'richTable',
          }),
          defineField({
            name: 'portableText',
            type: 'array',
            of: [
              defineArrayMember({type: 'block'}),
              defineArrayMember({
                name: 'richTable',
                title: 'Rich Table Block',
                type: 'richTableBlock',
              }),
              defineArrayMember({
                name: 'image',
                type: 'image',
              }),
            ],
          }),
          defineField({
            name: 'image',
            type: 'image',
          }),
          defineField({
            name: 'description',
            type: 'string',
          }),
        ],
      }),
      defineType({
        name: 'customPT',
        type: 'array',
        of: [
          defineArrayMember({
            type: 'block',
          }),
          defineArrayMember({
            type: 'image',
            options: {
              hotspot: true,
            },
            components: {
              tableBlock: TestBlock,
            },
            icon: ImageIcon,
          }),
          defineArrayMember({
            type: 'object',
            name: 'customBlock',
            icon: AsteriskIcon,
            components: {
              tableBlock: CustomBock,
            },
            fields: [
              defineField({
                name: 'title',
                type: 'string',
              }),
            ],
          }),
        ],
      }),
    ],
  },
})
