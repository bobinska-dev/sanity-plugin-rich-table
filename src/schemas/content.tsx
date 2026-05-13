import {defineArrayMember, defineType} from 'sanity'

/**
 * Sanity schema type for table cell content.
 *
 * This registers the `content` array type in Sanity's schema system. Sanity
 * fills in default decorators, styles, and lists during its own compilation
 * pipeline, but the raw object exported here does NOT contain them.
 *
 * The standalone PTE in {@link ../portable-text/ContentPortableTextEditor.tsx}
 * uses {@link ../portable-text/resolveSchemaDefinition.ts | defaultSchemaDefinition}
 * instead, which provides the same defaults in the format expected by
 * `@portabletext/editor` v6.
 */
export default defineType({
  name: 'content',
  title: 'Rich table content',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      // TODO: add customizations for block and inline block types, decorators, annotations, etc. as needed
      options: {
        // Restrict to a single line for table cell content to make it more manageable
        oneLine: false,
      },
    }),

    /*    defineArrayMember({
      type: 'image',
      name: 'image',
      title: 'Image',
      options: { hotspot: true },
      // TODO: Add small preview and block component so that less real estate is being used inside of the table cell
    }),*/
    // TODO: test out richTable inside of portable text
  ],
})
