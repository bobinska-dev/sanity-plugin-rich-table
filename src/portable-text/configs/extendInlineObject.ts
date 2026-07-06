import type {InlineObjectSchemaType} from '@portabletext/editor'
import type {
  ExtendInlineObjectSchemaType,
  ToolbarInlineObjectSchemaType,
} from '@portabletext/toolbar'
import type {ComponentType} from 'react'

/**
 * Minimal shape of an inline-object schema from Sanity (as extracted by
 * `extractBlockConfig`). Used to merge the schema-defined icon back onto the
 * toolbar inline object — the editor strips icons from its own toolbar schema,
 * the same way {@link createExtendBlockObject} restores block-object icons.
 */
export interface SanityInlineObjectSchemaLike {
  name: string
  icon?: ComponentType
}

/**
 * Creates an `extendInlineObject` that merges each Sanity inline-object schema's
 * icon into the matching toolbar inline object. Pass the extracted inline
 * objects (e.g. `extractBlockConfig(schemaType)?.inlineObjects`). When undefined,
 * returns a no-op extend that passes the inline object through unchanged.
 */
export function createExtendInlineObject(
  inlineObjectSchemas?: ReadonlyArray<SanityInlineObjectSchemaLike> | undefined,
): ExtendInlineObjectSchemaType {
  return (inlineObject: InlineObjectSchemaType): ToolbarInlineObjectSchemaType => {
    const schema = inlineObjectSchemas?.find((s) => s.name === inlineObject.name)
    if (!schema) return inlineObject as ToolbarInlineObjectSchemaType
    return {
      ...inlineObject,
      ...(schema.icon !== undefined && {icon: schema.icon}),
    } as ToolbarInlineObjectSchemaType
  }
}

/** Default extend that merges no schema config (e.g. tests). */
export const extendInlineObject: ExtendInlineObjectSchemaType = createExtendInlineObject()
