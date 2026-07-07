import type {SchemaDefinition} from '@portabletext/editor'
import type {ArraySchemaType, PortableTextBlock} from 'sanity'

import {extractBlockConfig} from './configs/extractBlockConfig'

/**
 * Standard Portable Text defaults matching what Sanity provides for a bare
 * `{type: 'block'}` member with no customisation. Used when no resolved block
 * schema is available, and per-group when the block omits that group.
 */
export const defaultSchemaDefinition: SchemaDefinition = {
  decorators: [
    {name: 'strong', title: 'Bold'},
    {name: 'em', title: 'Italic'},
    {name: 'underline', title: 'Underline'},
    {name: 'code', title: 'Code'},
    {name: 'strike-through', title: 'Strikethrough'},
  ],
  styles: [
    {name: 'normal', title: 'Normal'},
    {name: 'h1', title: 'Heading 1'},
    {name: 'h2', title: 'Heading 2'},
    {name: 'h3', title: 'Heading 3'},
    {name: 'h4', title: 'Heading 4'},
    {name: 'h5', title: 'Heading 5'},
    {name: 'h6', title: 'Heading 6'},
    {name: 'blockquote', title: 'Blockquote'},
  ],
  lists: [
    {name: 'bullet', title: 'Bullet'},
    {name: 'number', title: 'Number'},
  ],
  annotations: [
    {name: 'link', title: 'Link', fields: [{name: 'href', title: 'URL', type: 'string'}]},
  ],
}

/**
 * Convert a compiled Sanity Portable Text array schema into the
 * `SchemaDefinition` shape `@portabletext/editor` v7 expects.
 *
 * Reads the consumer's decorators/styles/lists/annotations/objects off the
 * compiled block via {@link extractBlockConfig} (the compiled paths are deeply
 * nested — see that helper). Sanity's compiler already fills the built-in
 * defaults for any group the block OMITS, so an empty group reaching us can only
 * mean the author explicitly declared it empty (e.g. `marks: {decorators: []}`
 * to disable all decorators). We therefore map each group straight through —
 * substituting defaults per-group would silently override that intent. The whole
 * defaults are returned only when no resolved block schema is present at all.
 */
export function resolveSchemaDefinition(
  schemaType?: ArraySchemaType<PortableTextBlock>,
): SchemaDefinition {
  const cfg = extractBlockConfig(schemaType)
  if (!cfg) return defaultSchemaDefinition

  return {
    decorators: cfg.decorators.map(({name, title}) => ({name, title})),
    styles: cfg.styles.map(({name, title}) => ({name, title})),
    lists: cfg.lists.map(({name, title}) => ({name, title})),
    annotations: cfg.annotations.map(({name, title, fields}) => ({name, title, fields})),
    blockObjects: cfg.blockObjects.map(({name, title, fields}) => ({name, title, fields})),
    inlineObjects: cfg.inlineObjects.map(({name, title, fields}) => ({name, title, fields})),
  }
}
