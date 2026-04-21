import type {SchemaDefinition} from '@portabletext/editor'

type BlockObjectDef = NonNullable<SchemaDefinition['blockObjects']>[number]

let _additionalBlockObjects: BlockObjectDef[] = []

export function setAdditionalBlockObjects(objects: BlockObjectDef[]): void {
  console.log('[rich-table] setAdditionalBlockObjects called with:', objects)
  _additionalBlockObjects = objects
}

export function getAdditionalBlockObjects(): BlockObjectDef[] {
  console.log('[rich-table] getAdditionalBlockObjects returning:', _additionalBlockObjects)
  return _additionalBlockObjects
}
