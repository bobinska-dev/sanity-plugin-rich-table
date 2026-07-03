import type {ArraySchemaType, ObjectSchemaType, Schema} from 'sanity'
import {describe, expect, it} from 'vitest'

import {isRichTableArrayMemberContext} from '../../utils/isRichTableArrayMemberContext'

const richTableType = {
  name: 'richTable',
  jsonType: 'object' as const,
  fields: [],
} as ObjectSchemaType

const tablesArrayType = {
  name: 'tables',
  jsonType: 'array' as const,
  of: [richTableType],
} as ArraySchemaType

const articleWithArrayField = {
  name: 'article',
  jsonType: 'object' as const,
  fields: [{name: 'tables', type: tablesArrayType}],
} as ObjectSchemaType

const articleWithDirectField = {
  name: 'article',
  jsonType: 'object' as const,
  fields: [{name: 'myTable', type: richTableType}],
} as ObjectSchemaType

const nestedObject = {
  name: 'nested',
  jsonType: 'object' as const,
  fields: [{name: 'tables', type: tablesArrayType}],
} as ObjectSchemaType

const articleWithNested = {
  name: 'article',
  jsonType: 'object' as const,
  fields: [{name: 'nested', type: nestedObject}],
} as ObjectSchemaType

const createSchema = (root: ObjectSchemaType): Schema =>
  ({
    get: (name: string) => {
      if (name === root.name) return root
      if (name === 'richTable') return richTableType
      return undefined
    },
  }) as unknown as Schema

describe('isRichTableArrayMemberContext', () => {
  const schemaArticleArray = createSchema(articleWithArrayField)
  const schemaArticleDirect = createSchema(articleWithDirectField)
  const schemaArticleNested = createSchema(articleWithNested)

  it('returns true when path ends at a keyed array member of type richTable', () => {
    expect(
      isRichTableArrayMemberContext({
        schema: schemaArticleArray,
        documentTypeName: 'article',
        path: ['tables', {_key: 'abc'}],
        objectSchemaTypeName: 'richTable',
      }),
    ).toBe(true)
  })

  it('returns false for a direct object field (path is a single field name)', () => {
    expect(
      isRichTableArrayMemberContext({
        schema: schemaArticleDirect,
        documentTypeName: 'article',
        path: ['myTable'],
        objectSchemaTypeName: 'richTable',
      }),
    ).toBe(false)
  })

  it('returns true for a nested object field that holds an array of richTable', () => {
    expect(
      isRichTableArrayMemberContext({
        schema: schemaArticleNested,
        documentTypeName: 'article',
        path: ['nested', 'tables', {_key: 'x'}],
        objectSchemaTypeName: 'richTable',
      }),
    ).toBe(true)
  })

  it('returns false when isInPortableText is true', () => {
    expect(
      isRichTableArrayMemberContext({
        schema: schemaArticleArray,
        documentTypeName: 'article',
        path: ['tables', {_key: 'abc'}],
        objectSchemaTypeName: 'richTable',
        isInPortableText: true,
      }),
    ).toBe(false)
  })

  it('returns false when object schema type is not richTable', () => {
    expect(
      isRichTableArrayMemberContext({
        schema: schemaArticleArray,
        documentTypeName: 'article',
        path: ['tables', {_key: 'abc'}],
        objectSchemaTypeName: 'richTableBlock',
      }),
    ).toBe(false)
  })

  it('returns false when path is empty', () => {
    expect(
      isRichTableArrayMemberContext({
        schema: schemaArticleArray,
        documentTypeName: 'article',
        path: [],
        objectSchemaTypeName: 'richTable',
      }),
    ).toBe(false)
  })

  it('returns false when document type is missing from schema', () => {
    expect(
      isRichTableArrayMemberContext({
        schema: schemaArticleArray,
        documentTypeName: 'unknownDoc',
        path: ['tables', {_key: 'abc'}],
        objectSchemaTypeName: 'richTable',
      }),
    ).toBe(false)
  })
})
