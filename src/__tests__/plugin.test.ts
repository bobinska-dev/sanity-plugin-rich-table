import {SchemaTypeDefinition} from 'sanity'
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
})
