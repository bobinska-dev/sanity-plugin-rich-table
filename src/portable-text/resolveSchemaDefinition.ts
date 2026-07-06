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
 * nested — see that helper). Any group the block doesn't define falls back to
 * the built-in defaults; the whole defaults are returned when no resolved block
 * schema is present.
 */
export function resolveSchemaDefinition(
  schemaType?: ArraySchemaType<PortableTextBlock>,
): SchemaDefinition {
  const cfg = extractBlockConfig(schemaType)
  if (!cfg) return defaultSchemaDefinition

  return {
    decorators: cfg.decorators.length
      ? cfg.decorators.map(({name, title}) => ({name, title}))
      : defaultSchemaDefinition.decorators,
    styles: cfg.styles.length
      ? cfg.styles.map(({name, title}) => ({name, title}))
      : defaultSchemaDefinition.styles,
    lists: cfg.lists.length
      ? cfg.lists.map(({name, title}) => ({name, title}))
      : defaultSchemaDefinition.lists,
    annotations: cfg.annotations.length
      ? cfg.annotations.map(({name, title, fields}) => ({name, title, fields}))
      : defaultSchemaDefinition.annotations,
    blockObjects: cfg.blockObjects.map(({name, title, fields}) => ({name, title, fields})),
    inlineObjects: cfg.inlineObjects.map(({name, title, fields}) => ({name, title, fields})),
  }
}
