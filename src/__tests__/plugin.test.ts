import {defineArrayMember, SchemaTypeDefinition} from 'sanity'
import {describe, expect, it} from 'vitest'

import {richTablePlugin} from '../index'

describe('richTablePlugin', () => {
  it('exports richTablePlugin function', () => {
    expect(richTablePlugin).toBeDefined()
    expect(typeof richTablePlugin).toBe('function')
  })

  it('returns a plugin configuration', () => {
    const plugin = richTablePlugin({})
    expect(plugin).toBeDefined()
    expect(plugin.name).toBe('rich-table')
  })

  it('has correct plugin name', () => {
    const plugin = richTablePlugin({})
    expect(plugin.name).toBe('rich-table')
  })

  it('registers schema types', () => {
    const plugin = richTablePlugin({})
    expect(plugin.schema).toBeDefined()
    expect(plugin.schema?.types).toBeDefined()
  })

  it('registers all required schema types', () => {
    const plugin = richTablePlugin({})
    const types = plugin.schema?.types as SchemaTypeDefinition[] | undefined
    const typeNames = types?.map((t: SchemaTypeDefinition) => t.name) ?? []

    expect(typeNames).toContain('richTable')
    expect(typeNames).toContain('richTableRow')
    expect(typeNames).toContain('richTableCell')
    expect(typeNames).toContain('columnHeader')
    expect(typeNames).toContain('richTableBlock')
    expect(typeNames).toContain('content')
  })

  it('registers exactly 6 schema types', () => {
    const plugin = richTablePlugin({})
    const types = plugin.schema?.types as SchemaTypeDefinition[] | undefined
    expect(types?.length).toBe(6)
  })

  it('uses default content schema when no options are provided', () => {
    const plugin = richTablePlugin({})
    const types = plugin.schema?.types as SchemaTypeDefinition[] | undefined
    const contentType = types?.find((t) => t.name === 'content') as SchemaTypeDefinition & {
      of?: Array<{type: string}>
    }
    expect(contentType).toBeDefined()
    expect(contentType.type).toBe('array')
    expect(contentType.of?.length).toBe(1)
    expect(contentType.of?.[0].type).toBe('block')
  })

  it('adds additional members alongside default block', () => {
    const plugin = richTablePlugin({
      cellContentAdditionalMembers: [
        defineArrayMember({type: 'image', name: 'image', title: 'Image'}),
      ],
    })
    const types = plugin.schema?.types as SchemaTypeDefinition[] | undefined
    const contentType = types?.find((t) => t.name === 'content') as SchemaTypeDefinition & {
      of?: Array<{type: string; name?: string}>
    }
    expect(contentType).toBeDefined()
    expect(contentType.name).toBe('content')
    // Default block + image
    expect(contentType.of?.length).toBe(2)
    expect(contentType.of?.[0].type).toBe('block')
    expect(contentType.of?.[1].type).toBe('image')
  })

  it('applies block overrides while keeping default block', () => {
    const plugin = richTablePlugin({
      cellContentBlockOverrides: {
        styles: [{title: 'Normal', value: 'normal'}],
      },
    })
    const types = plugin.schema?.types as SchemaTypeDefinition[] | undefined
    const contentType = types?.find((t) => t.name === 'content') as SchemaTypeDefinition & {
      of?: Array<{type: string; styles?: unknown[]}>
    }
    expect(contentType).toBeDefined()
    expect(contentType.of?.length).toBe(1)
    expect(contentType.of?.[0].type).toBe('block')
    expect(contentType.of?.[0].styles).toEqual([{title: 'Normal', value: 'normal'}])
  })
})
