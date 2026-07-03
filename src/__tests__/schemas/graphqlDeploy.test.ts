import {createSchema} from 'sanity'
import {describe, expect, it} from 'vitest'

import {richTablePlugin} from '../..'

/**
 * Regression guard for SYS-141.
 *
 * `sanity graphql deploy` runs `extractFromSanitySchema` locally and rejects any
 * array member that is an "anonymous inline object" — i.e. an object-typed array
 * member whose `_type` (its `name`, or its `type` when no `name` is given) is not
 * a registered top-level schema type. Giving the `rows` member `name: 'row'` while
 * registering the type as `richTableRow` is exactly that mismatch, and it broke
 * deploy with:
 *
 *   Encountered anonymous inline object "row" for field/type "rows".
 *
 * These tests assert the plugin's own schema never reintroduces that mismatch.
 */
describe('GraphQL deploy compatibility (SYS-141)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plugin = richTablePlugin({} as any)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const types = (plugin.schema?.types ?? []) as any[]
  const topLevelNames = new Set(types.map((t) => t.name))

  // Primitives and built-in object types the GraphQL generator handles without
  // requiring a registered top-level type of the same name.
  const primitives = new Set(['string', 'number', 'boolean', 'text', 'date', 'datetime', 'url'])
  const builtinObjects = new Set(['block', 'image', 'file', 'reference', 'slug', 'geopoint'])

  it('registers the row type as "row" so it matches the stored `_type: "row"`', () => {
    expect(topLevelNames.has('row')).toBe(true)
  })

  it('has no anonymous inline object array members', () => {
    const offenders: string[] = []

    const checkArrayMembers = (of: unknown, path: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const member of (of ?? []) as any[]) {
        const memberType: string = member.type
        // Effective `_type` written to content: the member `name`, or its `type`.
        const memberName: string = member.name ?? memberType

        if (primitives.has(memberType)) continue
        // A built-in object used without a custom `name` is fine (e.g. `block`).
        if (builtinObjects.has(memberType) && !member.name) continue

        if (!topLevelNames.has(memberName)) {
          offenders.push(`${path} -> member "${memberName}" (type: "${memberType}")`)
        }
      }
    }

    for (const type of types) {
      // Top-level array types (e.g. `content`).
      if (type.type === 'array') checkArrayMembers(type.of, type.name)
      // Array fields on object types.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const field of (type.fields ?? []) as any[]) {
        if (field?.type === 'array') checkArrayMembers(field.of, `${type.name}.${field.name}`)
      }
    }

    expect(offenders).toEqual([])
  })

  it('compiles without schema validation errors when embedded in a document', () => {
    const schema = createSchema({
      name: 'test',
      types: [
        ...types,
        {
          type: 'document',
          name: 'testDoc',
          fields: [
            {name: 'table', type: 'richTable'},
            {name: 'tables', type: 'array', of: [{type: 'richTable'}]},
            {name: 'body', type: 'array', of: [{type: 'block'}, {type: 'richTableBlock'}]},
          ],
        },
      ],
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const problems = ((schema as any)._validation ?? []).flatMap((g: any) => g.problems ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errors = problems.filter((p: any) => p?.severity === 'error')

    expect(errors).toEqual([])
    // Existing rows are stored as `_type: 'row'`, so the type must resolve under that name.
    expect(schema.get('row')).toBeDefined()
  })
})
