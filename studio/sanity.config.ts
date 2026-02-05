import {visionTool} from '@sanity/vision'
import {defineArrayMember, defineConfig, defineField, defineType} from 'sanity'
import {richTablePlugin} from 'sanity-plugin-rich-table'
import {structureTool} from 'sanity/structure'

export default defineConfig({
  name: 'default',
  title: 'Sanity Dev Studio',

  projectId: 'xonzamf8',
  dataset: 'production',

  plugins: [structureTool(), visionTool(), richTablePlugin({})],

  schema: {
    types: [
      defineType({
        type: 'document',
        name: 'myRichTableDocument',
        title: 'My Rich Table Document',
        fields: [
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
                name: 'richTableBlock',
                title: 'Rich Table Block',
                type: 'richTableBlock',
              }),
              defineArrayMember({
                name: 'richTable',
                title: 'Rich Table',
                type: 'richTable',
              }),
            ],
          }),
        ],
      }),
    ],
  },
})
