import {
  isArraySchemaType,
  isIndexSegment,
  isIndexTuple,
  isKeySegment,
  isObjectSchemaType,
  isReferenceSchemaType,
  type Path,
  type Schema,
  type SchemaType,
} from 'sanity'

type WalkAccumulator = {
  schemaType: SchemaType | undefined
  lastStepEnteredArrayItem: boolean
}

const getObjectFieldSchemaType = (
  objectType: SchemaType,
  fieldName: string,
): SchemaType | undefined => {
  if (!isObjectSchemaType(objectType)) return undefined
  const field = objectType.fields.find((f) => f.name === fieldName)
  if (!field) return undefined
  const fieldType = field.type
  if (isReferenceSchemaType(fieldType)) {
    const {to} = fieldType
    return to.length === 1 ? to[0] : undefined
  }
  return fieldType
}

const findArrayMemberByName = (
  arrayType: SchemaType,
  memberName: string,
  schema: Schema,
): SchemaType | undefined => {
  if (!isArraySchemaType(arrayType)) return undefined
  const fromOf = arrayType.of.find((member) => member.name === memberName)
  if (fromOf) return fromOf
  return schema.get(memberName)
}

const stepPath = (
  acc: WalkAccumulator,
  segment: Path[number],
  objectSchemaTypeName: string,
  schema: Schema,
): WalkAccumulator => {
  const {schemaType: current} = acc
  if (!current) {
    return {schemaType: undefined, lastStepEnteredArrayItem: false}
  }

  if (typeof segment === 'string') {
    const next = getObjectFieldSchemaType(current, segment)
    return {
      schemaType: next,
      lastStepEnteredArrayItem: false,
    }
  }

  if (isKeySegment(segment) || isIndexSegment(segment) || isIndexTuple(segment)) {
    if (!isArraySchemaType(current)) {
      return {schemaType: undefined, lastStepEnteredArrayItem: false}
    }
    const memberType = findArrayMemberByName(current, objectSchemaTypeName, schema)
    return {
      schemaType: memberType,
      lastStepEnteredArrayItem: true,
    }
  }

  return {schemaType: undefined, lastStepEnteredArrayItem: false}
}

/**
 * Whether the rich table object input sits under an array field (array member),
 * determined by walking the form path against the compiled schema.
 * Portable Text blocks and non-`richTable` object types are handled by the caller
 * (`isInPortableText` / schema type name).
 */
export const isRichTableArrayMemberContext = (params: {
  schema: Schema
  documentTypeName: string | undefined
  path: Path
  objectSchemaTypeName: string
  isInPortableText?: boolean
}): boolean => {
  const {schema, documentTypeName, path, objectSchemaTypeName, isInPortableText} = params

  if (isInPortableText) return false
  if (objectSchemaTypeName !== 'richTable') return false
  if (!documentTypeName) return false
  if (path.length === 0) return false

  const rootType = schema.get(documentTypeName)
  if (!rootType || !isObjectSchemaType(rootType)) return false

  const initial: WalkAccumulator = {
    schemaType: rootType,
    lastStepEnteredArrayItem: false,
  }

  const result = path.reduce<WalkAccumulator>(
    (acc, segment) => stepPath(acc, segment, objectSchemaTypeName, schema),
    initial,
  )

  if (!result.schemaType || result.schemaType.name !== objectSchemaTypeName) {
    return false
  }

  return result.lastStepEnteredArrayItem
}
