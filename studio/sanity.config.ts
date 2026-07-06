import {
  AsteriskIcon,
  BulbOutlineIcon,
  HighlightIcon,
  IceCreamIcon,
  ImageIcon,
  LinkIcon,
  TagIcon,
  TokenIcon,
} from '@sanity/icons'
import {visionTool} from '@sanity/vision'
import {defineArrayMember, defineConfig, defineField, defineType} from 'sanity'
import {structureTool} from 'sanity/structure'
import {richTablePlugin, richTableRules} from 'sanity-plugin-rich-table'

import CustomBock from './components/CustomBock'
import FootnoteAnnotation from './components/FootnoteAnnotation'
import HighlightDecorator from './components/HighlightDecorator'
import LeadStyle from './components/LeadStyle'
import LinkAnnotation from './components/LinkAnnotation'
import MentionInline from './components/MentionInline'
import StudioPTPlugins from './components/StudioPTPlugins'
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

  // Enable paste-to-import on document-body Portable Text fields (dev/testing).
  form: {
    components: {
      portableText: {
        plugins: StudioPTPlugins,
      },
    },
  },

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
            validation: (Rule) => Rule.required(),
          }),
          defineField({
            name: 'myRichTable',
            title: 'My Rich Table',
            type: 'richTable',
            // Per-instance validation on an object field.
            validation: richTableRules().minRows(2).requireColumnTitles(),
          }),
          defineField({
            name: 'myRichTables',
            title: 'My Richest of Tables',
            type: 'array',
            of: [
              defineArrayMember({
                name: 'richTableItem',
                type: 'richTable',
                // Per-instance validation on an array member (different rules).
                validation: richTableRules().minColumns(3),
              }),
            ],
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
                // Per-instance validation on a Portable Text block.
                validation: richTableRules().requireRowTitles().requireColumnTitles(),
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
      // SAPP-3812 repro: a rich table nested DEEP inside a page-builder array.
      // Adding a "Table block" and clicking the size picker must initialise the
      // table without the "Cannot apply deep operations on primitive values"
      // error, at every nesting position below.
      defineType({
        type: 'document',
        name: 'contentPage',
        title: 'Content Page (SAPP-3812)',
        fields: [
          defineField({
            name: 'title',
            type: 'string',
          }),
          defineField({
            name: 'pageBuilder',
            title: 'Page builder',
            type: 'array',
            of: [
              defineArrayMember({
                name: 'tableBlock',
                title: 'Table block',
                type: 'object',
                fields: [
                  defineField({
                    name: 'heading',
                    type: 'string',
                  }),
                  // (1) richTable as an OBJECT FIELD inside an array item — the
                  // exact customer repro (`pageBuilder[_key].tableContent`).
                  defineField({
                    name: 'tableContent',
                    title: 'Table content (field in array item)',
                    type: 'richTable',
                  }),
                  // (2) richTable wrapped one further OBJECT level deep inside the
                  // array item (`pageBuilder[_key].group.tableContent`).
                  defineField({
                    name: 'group',
                    title: 'Group',
                    type: 'object',
                    options: {collapsible: true, collapsed: false},
                    fields: [
                      defineField({
                        name: 'tableContent',
                        title: 'Nested table content',
                        type: 'richTable',
                      }),
                    ],
                  }),
                  // (3) richTable as an ARRAY MEMBER two array-levels deep
                  // (`pageBuilder[_key].sections[_key]`). This is the case the old
                  // schema-walk mis-detected — clicking the picker here used to
                  // strip the item's _key/_type. Uses a renamed member on purpose.
                  defineField({
                    name: 'sections',
                    title: 'Sections (nested table members)',
                    type: 'array',
                    of: [
                      defineArrayMember({
                        name: 'sectionTable',
                        title: 'Section table',
                        type: 'richTable',
                      }),
                    ],
                  }),
                ],
              }),
            ],
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
                // Custom cell visual goes on the table-specific `tableInlineBlock`
                // slot (sibling of `tableBlock` for block objects), NOT the
                // standard `inlineBlock`: that leaves the native PT input's default
                // inline-object rendering intact so the edit form still opens on
                // the object (onPathOpen), while the cell editor renders MentionInline.
                components: {tableInlineBlock: MentionInline},
              }),
              // FALLBACK DEMO — inline object with NO tableInlineBlock, so the
              // cell renders the built-in DefaultInlineBlock title chip.
              defineArrayMember({
                name: 'fallbackInline',
                title: 'Token (fallback demo)',
                type: 'object',
                icon: TokenIcon,
                fields: [defineField({name: 'label', type: 'string'})],
                preview: {select: {title: 'label'}},
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
                      validation: (Rule) =>
                        Rule.uri({scheme: ['http', 'https', 'mailto', 'tel']}).required(),
                    }),
                  ],
                  // Cell visual on the table-specific `tableAnnotation` slot
                  // (sibling of `tableBlock`); leaves the native `annotation` slot
                  // for Sanity's default rendering in the debug/document view.
                  components: {tableAnnotation: LinkAnnotation},
                },
                {
                  name: 'footnote',
                  type: 'object',
                  title: 'Footnote',
                  icon: AsteriskIcon,
                  fields: [{name: 'text', type: 'string', title: 'Note'}],
                  components: {tableAnnotation: FootnoteAnnotation},
                },
                // FALLBACK DEMO — annotation with NO tableAnnotation, so the cell
                // renders the built-in dotted-underline default (data-annotation="keyword").
                {
                  name: 'keyword',
                  type: 'object',
                  title: 'Keyword (fallback demo)',
                  icon: TagIcon,
                  fields: [defineField({name: 'term', type: 'string', title: 'Term'})],
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
            preview: {
              select: {
                title: 'title',
              },
            },
          }),
          // FALLBACK DEMO — reference with NO tableBlock, so the cell renders the
          // built-in ReferenceBlock (fetches & previews the referenced document).
          defineArrayMember({
            type: 'reference',
            name: 'fallbackReference',
            title: 'Reference (fallback demo)',
            to: [{type: 'myRichTableDocument'}],
          }),
          // FALLBACK DEMO — plain object with NO tableBlock, so the cell renders
          // the built-in DefaultCustomBlock (schema preview select/prepare + icon).
          defineArrayMember({
            type: 'object',
            name: 'fallbackCallout',
            title: 'Callout (fallback demo)',
            icon: BulbOutlineIcon,
            fields: [
              defineField({name: 'title', type: 'string'}),
              defineField({name: 'body', type: 'text'}),
            ],
            preview: {select: {title: 'title', subtitle: 'body'}},
          }),
        ],
      }),
    ],
  },
})
