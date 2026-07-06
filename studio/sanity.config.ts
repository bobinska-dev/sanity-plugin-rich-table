import {AsteriskIcon, HighlightIcon, IceCreamIcon, ImageIcon, LinkIcon} from '@sanity/icons'
import {visionTool} from '@sanity/vision'
import {defineArrayMember, defineConfig, defineField, defineType} from 'sanity'
import {structureTool} from 'sanity/structure'
import {richTablePlugin} from 'sanity-plugin-rich-table'

import CustomBock from './components/CustomBock'
import FootnoteAnnotation from './components/FootnoteAnnotation'
import HighlightDecorator from './components/HighlightDecorator'
import LeadStyle from './components/LeadStyle'
import LinkAnnotation from './components/LinkAnnotation'
import MentionInline from './components/MentionInline'
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
            name: 'myRichTables',
            title: 'My Richest of Tables',
            type: 'array',
            of: [
              defineArrayMember({
                name: 'richTableItem',
                type: 'richTable',
              }),
            ],
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
            of: [
              defineArrayMember({
                name: 'inlineBlock',
                type: 'object',
                icon: IceCreamIcon,
                fields: [
                  defineField({
                    name: 'test',
                    type: 'string',
                  }),
                ],
                // Inline objects render via Sanity's single native
                // `components.inlineBlock` slot (no table-specific sibling —
                // only block objects need `tableBlock`).
                components: {inlineBlock: MentionInline},
              }),
            ],
            // Demo of a fully customisable cell PTE: the standard marks plus a
            // custom style, decorator and annotation (each with its own icon).
            // The toolbar shows the icons; the renderer tags custom output with
            // data-style / data-decorator / data-annotation for CSS targeting.
            styles: [
              {title: 'Normal', value: 'normal'},
              {title: 'Heading 1', value: 'h1'},
              {title: 'Heading 2', value: 'h2'},
              // Custom style with its own render component (mirrors custom blocks).
              {title: 'Lead', value: 'lead', icon: AsteriskIcon, component: LeadStyle},
            ],
            lists: [
              {title: 'Bullet', value: 'bullet'},
              {title: 'Numbered', value: 'number'},
            ],
            marks: {
              decorators: [
                {title: 'Strong', value: 'strong'},
                {title: 'Emphasis', value: 'em'},
                // Custom decorator with its own render component.
                {
                  title: 'Highlight',
                  value: 'highlight',
                  icon: HighlightIcon,
                  component: HighlightDecorator,
                },
              ],
              annotations: [
                {
                  name: 'link',
                  type: 'object',
                  icon: LinkIcon,
                  fields: [
                    defineField({
                      name: 'href',
                      type: 'url',
                      title: 'URL',
                      // Allow email and telephone links in addition to web URLs.
                      validation: (Rule) => Rule.uri({scheme: ['http', 'https', 'mailto', 'tel']}),
                    }),
                  ],
                  // Annotations use Sanity's native `components.annotation` slot.
                  components: {annotation: LinkAnnotation},
                },
                {
                  name: 'footnote',
                  type: 'object',
                  title: 'Footnote',
                  icon: AsteriskIcon,
                  fields: [{name: 'text', type: 'string', title: 'Note'}],
                  components: {annotation: FootnoteAnnotation},
                },
              ],
            },
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
