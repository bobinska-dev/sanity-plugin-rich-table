import type {SchemaDefinition} from '@portabletext/editor'

type BlockObjectDef = NonNullable<SchemaDefinition['blockObjects']>[number]

/**
 * Module-level store for additional block objects configured via plugin options.
 * Set once at plugin init, read by the PTE editor component.
 */
let _additionalBlockObjects: BlockObjectDef[] = []

export function setAdditionalBlockObjects(objects: BlockObjectDef[]): void {
  console.log('[rich-table] setAdditionalBlockObjects called with:', objects)
  _additionalBlockObjects = objects
}

export function getAdditionalBlockObjects(): BlockObjectDef[] {
  console.log('[rich-table] getAdditionalBlockObjects returning:', _additionalBlockObjects)
  return _additionalBlockObjects
}
