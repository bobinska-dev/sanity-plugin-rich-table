import {type ArraySchemaType, createSchema, type PortableTextBlock} from 'sanity'
import {describe, expect, it} from 'vitest'

import {
  defaultSchemaDefinition,
  resolveSchemaDefinition,
} from '../../portable-text/resolveSchemaDefinition'

describe('resolveSchemaDefinition', () => {
  it('returns the built-in defaults when no schema is resolved', () => {
    expect(resolveSchemaDefinition(undefined)).toBe(defaultSchemaDefinition)
  })

  it('extracts custom styles/decorators/annotations and block/inline objects', () => {
    const schema = createSchema({
      name: 'test',
      types: [
        {
          name: 'customPT',
          type: 'array',
          of: [
            {
              type: 'block',
              styles: [
                {title: 'Normal', value: 'normal'},
                {title: 'Lead', value: 'lead'},
              ],
              lists: [{title: 'Bullet', value: 'bullet'}],
              marks: {
                decorators: [{title: 'Strong', value: 'strong'}],
                annotations: [
                  {name: 'footnote', type: 'object', fields: [{name: 'text', type: 'string'}]},
                ],
              },
              of: [{name: 'mention', type: 'object', fields: [{name: 'id', type: 'string'}]}],
            },
            {name: 'callout', type: 'object', fields: [{name: 'heading', type: 'string'}]},
          ],
        },
      ],
    })
    const customPT = schema.get('customPT') as ArraySchemaType<PortableTextBlock>
    const def = resolveSchemaDefinition(customPT)

    expect((def.styles ?? []).map((s) => s.name)).toContain('lead')
    expect((def.decorators ?? []).map((d) => d.name)).toContain('strong')
    expect((def.annotations ?? []).map((a) => a.name)).toContain('footnote')
    expect((def.blockObjects ?? []).map((o) => o.name)).toContain('callout')
    expect((def.inlineObjects ?? []).map((o) => o.name)).toContain('mention')
  })
})
