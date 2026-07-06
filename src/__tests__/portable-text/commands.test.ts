import type {EditorSchema} from '@portabletext/editor'
import {describe, expect, it} from 'vitest'

import {buildSlashCommands, CommandMatch} from '../../portable-text/pte-slash-commands/commands'

// A representative compiled cell schema: the built-in marks plus custom entries
// (a `lead` style, a `highlight` decorator) and a block + inline object.
const schema = {
  block: {name: 'block'},
  span: {name: 'span'},
  styles: [
    {name: 'normal', title: 'Normal', value: 'normal'},
    {name: 'h1', title: 'Heading 1', value: 'h1'},
    {name: 'h2', title: 'Heading 2', value: 'h2'},
    {name: 'blockquote', title: 'Quote', value: 'blockquote'},
    {name: 'lead', title: 'Lead', value: 'lead'},
  ],
  decorators: [
    {name: 'strong', title: 'Strong', value: 'strong'},
    {name: 'em', title: 'Emphasis', value: 'em'},
    {name: 'highlight', title: 'Highlight', value: 'highlight'},
  ],
  lists: [
    {name: 'bullet', title: 'Bullet', value: 'bullet'},
    {name: 'number', title: 'Numbered', value: 'number'},
  ],
  annotations: [{name: 'link', fields: []}],
  blockObjects: [{name: 'image', title: 'Image', fields: []}],
  inlineObjects: [{name: 'mention', title: 'Mention', fields: []}],
} as unknown as EditorSchema

const commands = buildSlashCommands(schema)

describe('buildSlashCommands', () => {
  it('builds a command per style, decorator, list, block object and inline object', () => {
    expect(Array.isArray(commands)).toBe(true)
    // 5 styles + 3 decorators + 2 lists + 1 block + 1 inline object.
    expect(commands.length).toBe(12)
  })

  it('all commands have required properties', () => {
    commands.forEach((command: CommandMatch) => {
      expect(typeof command.key).toBe('string')
      expect(typeof command.label).toBe('string')
      expect(command.label.length).toBeGreaterThan(0)
      expect(typeof command.description).toBe('string')
      expect(command.description.length).toBeGreaterThan(0)
      expect(command.icon).toBeDefined()
      expect(Array.isArray(command.keywords)).toBe(true)
      expect(command.action.type).toBeDefined()
    })
  })

  it('all commands have unique keys', () => {
    const keys = commands.map((c) => c.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('style commands', () => {
  const styleCommands = commands.filter((c) => c.action.type === 'style.toggle')

  it('includes a command per schema style, keyed by name and titled from the schema', () => {
    expect(styleCommands).toHaveLength(5)
    const normal = styleCommands.find((c) => c.key === 'style:normal')
    expect(normal?.label).toBe('Normal')
    expect(normal?.action).toEqual({type: 'style.toggle', style: 'normal'})
  })

  it('includes heading commands h1/h2', () => {
    for (const name of ['h1', 'h2']) {
      const heading = styleCommands.find((c) => c.key === `style:${name}`)
      expect(heading?.action).toEqual({type: 'style.toggle', style: name})
      expect(heading?.keywords).toContain('heading')
    }
  })

  it('includes the custom lead style', () => {
    const lead = styleCommands.find((c) => c.key === 'style:lead')
    expect(lead?.label).toBe('Lead')
    expect(lead?.action).toEqual({type: 'style.toggle', style: 'lead'})
  })
})

describe('decorator commands', () => {
  const decoratorCommands = commands.filter((c) => c.action.type === 'decorator.toggle')

  it('includes a command per decorator, including custom ones', () => {
    expect(decoratorCommands).toHaveLength(3)
    const strong = decoratorCommands.find((c) => c.key === 'decorator:strong')
    expect(strong?.action).toEqual({type: 'decorator.toggle', decorator: 'strong'})
    const highlight = decoratorCommands.find((c) => c.key === 'decorator:highlight')
    expect(highlight?.label).toBe('Highlight')
    expect(highlight?.action).toEqual({type: 'decorator.toggle', decorator: 'highlight'})
  })
})

describe('list commands', () => {
  const listCommands = commands.filter((c) => c.action.type === 'list item.toggle')

  it('includes bullet and numbered lists with a "list" keyword', () => {
    for (const name of ['bullet', 'number']) {
      const list = listCommands.find((c) => c.key === `list:${name}`)
      expect(list?.action).toEqual({type: 'list item.toggle', listItem: name})
      expect(list?.keywords).toContain('list')
    }
  })
})

describe('object commands', () => {
  it('includes an insert command per block object', () => {
    const image = commands.find((c) => c.key === 'block:image')
    expect(image?.label).toBe('Image')
    expect(image?.action).toEqual({type: 'insert.block', block: {_type: 'image'}})
  })

  it('includes an insert command per inline object', () => {
    const mention = commands.find((c) => c.key === 'inline:mention')
    expect(mention?.label).toBe('Mention')
    expect(mention?.action).toEqual({type: 'insert.inline object', inlineObject: {name: 'mention'}})
  })
})
