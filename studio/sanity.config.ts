import {visionTool} from '@sanity/vision'
import {defineArrayMember, defineConfig, defineField, defineType} from 'sanity'

import {structureTool} from 'sanity/structure'
import {AsteriskIcon, IceCreamIcon, ImageIcon} from '@sanity/icons'
import {richTablePlugin} from 'sanity-plugin-rich-table'
import TestBlock from './TestBlock'
import {TbDog} from 'react-icons/tb'

export default defineConfig({
  name: 'default',
  title: 'Sanity Dev Studio',

  projectId: 'xonzamf8',
  dataset: 'production',

  plugins: [
    structureTool(),
    visionTool(),
    // @ts-ignore
    richTablePlugin({
      customBlockTypes: [
        {
          icon: ImageIcon,
          type: {
            name: 'image',
            type: 'image',
            title: 'Image test',
            options: {hotspot: true},
            icon: ImageIcon,
            // TODO: check status https://linear.app/sanity/issue/CRX-1914/standalone-pte-blockrenderprops-strips-down-schematype-and-removes
            /*      components: {
              //@ts-ignore
              block: TestBlock
            }*/
          },
        },
        {
          icon: IceCreamIcon,
          type: {
            name: 'reference',
            type: 'reference',
            title: 'Reference',
            to: [{type: 'myRichTableDocument'}],
            icon: IceCreamIcon,
          },
          defaultValues: {},
        },
        {
          icon: AsteriskIcon,
          defaultValues: {
            testField: 'Default value for test field',
          },
          type: {
            name: 'testBlock',
            type: 'object',
            title: 'Test block',
            icon: AsteriskIcon,
            fields: [
              {
                name: 'testField',
                type: 'string',
                title: 'Test field',
              },
              {
                name: 'testField2',
                type: 'string',
                title: 'Test field 2',
              },
            ],
            preview: {
              select: {title: 'testField', subtitle: 'testField2'},
            },
          },
        },
      ],
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
            name: 'title',
            type: 'string',
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
    ],
  },
})
