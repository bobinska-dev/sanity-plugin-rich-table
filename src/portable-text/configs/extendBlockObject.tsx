import type {BlockObjectSchemaType} from '@portabletext/editor'
import type {ExtendBlockObjectSchemaType, ToolbarBlockObjectSchemaType} from '@portabletext/toolbar'
import type {ComponentType} from 'react'

/**
 * Minimal shape of a block schema from Sanity (e.g. from schemaType.type.of).
 * Used to merge icon, components, and other config from your schema into the toolbar block object.
 */
export interface SanityBlockSchemaLike {
  name: string
  icon?: ComponentType
  components?: Record<string, ComponentType>
  initialValue?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * Creates an extendBlockObject function that merges config from your Sanity block schemas
 * (e.g. from schemaType.type.of) into each toolbar block object.
 * Use this when you have access to the schema type (e.g. in ButtonToolbar) so that
 * custom icons, components, and config are applied in one place.
 *
 * @param blockSchemas - Optional array of block schemas from your schema type (e.g. schemaType?.type?.of).
 *                       When undefined, returns a no-op extend that passes through the block object unchanged.
 */
export function createExtendBlockObject(
  blockSchemas?: ReadonlyArray<SanityBlockSchemaLike> | undefined,
): ExtendBlockObjectSchemaType {
  return (blockObject: BlockObjectSchemaType): ToolbarBlockObjectSchemaType => {
    const schema = blockSchemas?.find((s) => s.name === blockObject.name)
    if (!schema) return blockObject as ToolbarBlockObjectSchemaType
    return {
      ...blockObject,
      ...(schema.icon !== undefined && {icon: schema.icon}),
      ...(schema.initialValue !== undefined && {defaultValues: schema.initialValue}),
      ...(schema.components !== undefined && {components: schema.components}),
    } as ToolbarBlockObjectSchemaType
  }
}

/**
 * Default extend that does not merge any schema config.
 * Used when block schemas are not available (e.g. SlashCommandPicker, tests).
 */
export const extendBlockObject: ExtendBlockObjectSchemaType = createExtendBlockObject()
