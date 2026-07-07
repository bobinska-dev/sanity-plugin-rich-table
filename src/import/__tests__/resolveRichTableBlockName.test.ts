import {describe, expect, it} from 'vitest'

import {resolveRichTableBlockName} from '../resolveRichTableBlockName'

// The rich-table block's structural signature: a block object with `rows` and
// `columnHeaders` fields, whatever its member name.
const tableBlock = (name: string) => ({
  name,
  fields: [{name: 'rows'}, {name: 'columnHeaders'}, {name: 'hasColumnTitles'}],
})
const otherBlock = (name: string) => ({name, fields: [{name: 'url'}, {name: 'caption'}]})

describe('resolveRichTableBlockName (auto-detect the block _type by structure, not name)', () => {
  it('detects the default un-renamed member', () => {
    const schema = {blockObjects: [otherBlock('image'), tableBlock('richTableBlock')]}
    expect(resolveRichTableBlockName(schema)).toBe('richTableBlock')
  })

  it('detects a RENAMED member by its rows+columnHeaders signature', () => {
    for (const name of ['richTable', 'tableRenamed', 'myFancyTable']) {
      const schema = {blockObjects: [otherBlock('image'), tableBlock(name)]}
      expect(resolveRichTableBlockName(schema)).toBe(name)
    }
  })

  it('falls back to "richTableBlock" when no table block is identifiable', () => {
    expect(resolveRichTableBlockName({blockObjects: [otherBlock('image')]})).toBe('richTableBlock')
    expect(resolveRichTableBlockName({blockObjects: []})).toBe('richTableBlock')
    expect(resolveRichTableBlockName({})).toBe('richTableBlock')
    expect(resolveRichTableBlockName(undefined)).toBe('richTableBlock')
  })
})
