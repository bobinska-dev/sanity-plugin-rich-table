import {describe, expect, it} from 'vitest'

import {extractBlockConfig} from '../portable-text/configs/extractBlockConfig'
import {findRecursiveCellType} from '../portable-text/findRecursiveCellType'
import {resolveCellContentSchemaType} from '../portable-text/resolveCellContentSchemaType'
import {extendsType} from '../portable-text/schemaTypeChain'

/**
 * Rename-safety: the plugin must resolve members by their UNDERLYING TYPE (the
 * compiled `.type` chain / structure), never by a hard-coded member `name`, so
 * consumers can rename any array member / block object freely. These exercise
 * the pure resolution helpers across a myriad of custom-schema shapes and names.
 */

// A compiled schema-type node with an inheritance chain of the given base names,
// under an arbitrary member `name`. e.g. chain('heroImage', 'image', 'object').
const chain = (...names: string[]): Record<string, unknown> =>
  names.reduceRight<Record<string, unknown> | undefined>(
    (type, name) => ({name, ...(type ? {type} : {})}),
    undefined,
  ) as Record<string, unknown>

describe('rename-safety: extendsType (route by base type, any member name)', () => {
  const bases = ['image', 'reference', 'richTable', 'block']
  for (const base of bases) {
    it(`matches a renamed member whose chain reaches "${base}"`, () => {
      for (const memberName of [base, `my${base}`, `${base}WithExtras`, 'totallyCustomName']) {
        expect(extendsType(chain(memberName, base, 'object'), base)).toBe(true)
      }
    })
    it(`matches "${base}" nested several levels deep`, () => {
      expect(extendsType(chain('a', 'b', base, 'object'), base)).toBe(true)
    })
    it(`does NOT match a member of an unrelated base for "${base}"`, () => {
      expect(extendsType(chain('renamedThing', 'somethingElse', 'object'), base)).toBe(false)
    })
  }

  it('never loops on a self-referential compiled chain', () => {
    const cyclic: {name: string; type?: unknown} = {name: 'loop'}
    cyclic.type = cyclic
    expect(() => extendsType(cyclic, 'image')).not.toThrow()
    expect(extendsType(cyclic, 'image')).toBe(false)
  })
})

describe('rename-safety: findRecursiveCellType (detect a table in cell content by type)', () => {
  const schemaWith = (arrayType: unknown) => ({get: () => arrayType})

  it('flags richTableBlock and custom-named table members alike', () => {
    for (const name of ['richTableBlock', 'richTable', 'nestedTable', 'myTableThing']) {
      const schema = schemaWith({of: [chain('block', 'block'), chain(name, 'richTable', 'object')]})
      expect(findRecursiveCellType(schema, 'cellContent')).toBe(name)
    }
  })

  it('does not flag a normal (table-free) cell schema whatever the block is named', () => {
    const schema = schemaWith({of: [chain('renamedTextBlock', 'block', 'object')]})
    expect(findRecursiveCellType(schema, 'cellContent')).toBeUndefined()
  })
})

describe('rename-safety: resolveCellContentSchemaType (cell content from its own field)', () => {
  const members = [{name: 'block'}]

  it('resolves regardless of the content array type name', () => {
    for (const typeName of ['content', 'richTableCellContent', 'myCellPortableText']) {
      const field = {name: 'content', type: {name: typeName, of: members}}
      expect(resolveCellContentSchemaType(field)?.name).toBe(typeName)
    }
  })

  it('handles the field-descriptor, direct-array, and deeply-wrapped shapes', () => {
    expect(resolveCellContentSchemaType({name: 'x', type: {name: 'ct', of: members}})?.name).toBe(
      'ct',
    )
    expect(resolveCellContentSchemaType({name: 'ct', of: members})?.name).toBe('ct')
    expect(
      resolveCellContentSchemaType({name: 'a', type: {name: 'b', type: {name: 'ct', of: members}}})
        ?.name,
    ).toBe('ct')
  })
})

/**
 * A compiled Portable Text array whose text block is registered under
 * `blockName` (default 'block'), plus optional extra top-level members
 * (block objects). Mirrors the deeply-nested shape `extractBlockConfig` reads.
 */
const compiledPtArray = (blockName: string, blockObjects: Record<string, unknown>[] = []) => ({
  of: [
    {
      name: blockName,
      fields: [
        {name: 'style', type: {options: {list: [{value: 'normal', title: 'Normal'}]}}},
        {name: 'listItem', type: {options: {list: [{value: 'bullet', title: 'Bullet'}]}}},
        {
          name: 'children',
          type: {
            of: [
              {
                name: 'span',
                decorators: [{value: 'strong', title: 'Bold'}],
                annotations: [{name: 'link', title: 'Link', fields: [{name: 'href', type: 'url'}]}],
              },
              {name: 'mention', title: 'Mention', fields: [{name: 'label', type: 'string'}]},
            ],
          },
        },
      ],
    },
    ...blockObjects,
  ],
})

describe('rename-safety: extractBlockConfig (structural, not by "block"/"span" names)', () => {
  it('extracts the same config whether the text block is named "block" or renamed', () => {
    const fromDefault = extractBlockConfig(compiledPtArray('block') as never)
    const fromRenamed = extractBlockConfig(compiledPtArray('myProseBlock') as never)

    for (const cfg of [fromDefault, fromRenamed]) {
      expect(cfg?.decorators.map((d) => d.name)).toContain('strong')
      expect(cfg?.styles.map((s) => s.name)).toContain('normal')
      expect(cfg?.lists.map((l) => l.name)).toContain('bullet')
      expect(cfg?.annotations.map((a) => a.name)).toContain('link')
      expect(cfg?.inlineObjects.map((o) => o.name)).toContain('mention')
    }
  })

  it('lists custom-named block objects regardless of their names', () => {
    const cfg = extractBlockConfig(
      compiledPtArray('block', [
        {name: 'heroImage', fields: []},
        {name: 'authorRef', fields: [], to: [{type: 'author'}]},
        {name: 'calloutBox', fields: [{name: 'title', type: 'string'}]},
      ]) as never,
    )
    const names = cfg?.blockObjects.map((b) => b.name)
    expect(names).toEqual(expect.arrayContaining(['heroImage', 'authorRef', 'calloutBox']))
  })
})

describe('rename-safety: real-world consumer cell schema (os-apps `richTableCellContent`)', () => {
  const cmp = () => null
  // Models the actual consumer schema: custom styles/decorators/annotations with
  // in-cell components, inline objects (mention/channel/slackEmoji), and a named
  // image block (imageWithCaption). `typeName` lets us prove the content-array
  // rename doesn't change anything.
  const cellContent = (typeName: string) => ({
    name: typeName,
    of: [
      {
        name: 'block',
        fields: [
          {
            name: 'style',
            type: {
              options: {
                list: [
                  {value: 'normal', title: 'Normal'},
                  {value: 'h2', title: 'H2'},
                  {value: 'blockquote', title: 'Quote'},
                  {value: 'label', title: 'Label', component: cmp},
                ],
              },
            },
          },
          {name: 'listItem', type: {options: {list: [{value: 'bullet', title: 'Bullet'}]}}},
          {
            name: 'children',
            type: {
              of: [
                {
                  name: 'span',
                  decorators: [
                    {value: 'strong', title: 'Strong'},
                    {value: 'highlight', title: 'Highlight', component: cmp},
                    {value: 'accent', title: 'Accent', component: cmp},
                  ],
                  annotations: [
                    {
                      name: 'link',
                      title: 'Link',
                      fields: [{name: 'href', type: 'url'}],
                      components: {tableAnnotation: cmp},
                    },
                  ],
                },
                {
                  name: 'mention',
                  title: 'Mention',
                  fields: [],
                  components: {tableInlineBlock: cmp},
                },
                {
                  name: 'channel',
                  title: 'Channel',
                  fields: [],
                  components: {tableInlineBlock: cmp},
                },
                {
                  name: 'slackEmoji',
                  title: 'Emoji',
                  fields: [],
                  components: {tableInlineBlock: cmp},
                },
              ],
            },
          },
        ],
      },
      {
        name: 'imageWithCaption',
        title: 'Image',
        fields: [{name: 'caption', type: 'string'}],
        components: {tableBlock: cmp},
      },
    ],
  })

  it('extracts every custom mark/object with its in-cell component', () => {
    const cfg = extractBlockConfig(cellContent('richTableCellContent') as never)
    expect(cfg?.styles.find((s) => s.name === 'label')?.component).toBe(cmp)
    expect(cfg?.decorators.map((d) => d.name)).toEqual(
      expect.arrayContaining(['highlight', 'accent']),
    )
    expect(cfg?.annotations.find((a) => a.name === 'link')?.component).toBe(cmp)
    expect(cfg?.inlineObjects.map((o) => o.name)).toEqual(
      expect.arrayContaining(['mention', 'channel', 'slackEmoji']),
    )
    expect(cfg?.blockObjects.map((b) => b.name)).toContain('imageWithCaption')
  })

  it('resolves + extracts identically when the content type is renamed', () => {
    // The cell content field as Table passes it, with the content type renamed.
    const field = {name: 'content', type: cellContent('someRenamedCellPT')}
    const resolved = resolveCellContentSchemaType(field)
    expect(resolved?.name).toBe('someRenamedCellPT')
    const cfg = extractBlockConfig(resolved as never)
    expect(cfg?.decorators.map((d) => d.name)).toContain('accent')
    expect(cfg?.inlineObjects.map((o) => o.name)).toContain('slackEmoji')
    expect(cfg?.blockObjects.map((b) => b.name)).toContain('imageWithCaption')
  })
})
