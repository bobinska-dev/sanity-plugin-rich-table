import {defineArrayMember, defineType} from 'sanity'

/**
 * Sanity schema type for table cell content.
 *
 * This registers the `content` array type in Sanity's schema system. Sanity
 * fills in default decorators, styles, and lists during its own compilation
 * pipeline, but the raw object exported here does NOT contain them.
 *
 * The standalone PTE in {@link ../portable-text/ContentPortableTextEditor.tsx}
 * reads the compiled schema type via `useSchema()`, so it receives those same
 * Sanity-provided defaults in the format expected by `@portabletext/editor`.
 */
export default defineType({
  name: 'content',
  title: 'Rich table content',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
    }),
  ],
})

/**
 * The `content` array member registered by the plugin as the default cell schema.
 *
 * Custom blocks, inline objects and annotations are now defined entirely in the
 * consumer's own Portable Text schema (passed via `portableTextSchemaTypeName`,
 * which carries their fields, initial values and `table*` render slots in one
 * place), so this fallback member is plain Portable Text — used only when no
 * `portableTextSchemaTypeName` is provided.
 */
export const defineContentArrayMember = () =>
  defineArrayMember({
    name: 'content',
    title: 'Rich table content',
    type: 'array',
    of: [
      defineArrayMember({
        type: 'block',
      }),
    ],
  })
