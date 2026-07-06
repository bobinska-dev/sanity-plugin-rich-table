import type {Path} from 'sanity'
import {describe, expect, it} from 'vitest'

import {isRichTableArrayMemberContext} from '../../utils/isRichTableArrayMemberContext'

// Membership is decided purely from the input's own path: an array item always
// ends in a key/index segment, at any nesting depth, so the check must hold
// WHEREVER the rich table is used (SAPP-3812).
describe('isRichTableArrayMemberContext', () => {
  const isMember = (path: Path, isInPortableText?: boolean) =>
    isRichTableArrayMemberContext({path, isInPortableText})

  describe('array members (true)', () => {
    it('returns true for a direct array member (path ends in a key segment)', () => {
      expect(isMember(['tables', {_key: 'abc'}])).toBe(true)
    })

    it('returns true for an index-addressed array member', () => {
      expect(isMember(['tables', 0])).toBe(true)
    })

    it('returns true for a renamed array member (no hardcoded type name)', () => {
      // defineArrayMember({name: 'richTableItem', type: 'richTable'}) — the path
      // still ends in a key segment, so the member is detected regardless of name.
      expect(isMember(['namedTables', {_key: 'abc'}])).toBe(true)
    })

    it('returns true for a member reached through a nested object field', () => {
      expect(isMember(['nested', 'tables', {_key: 'x'}])).toBe(true)
    })

    it('returns true for a member nested several object levels deep', () => {
      expect(isMember(['wrapper', 'layout', 'tables', {_key: 'abc'}])).toBe(true)
    })

    // The case the old schema-walk got WRONG: a richTable array member whose
    // array is a field on ANOTHER array's item (two array levels deep). Key
    // segments carry no type info, so the walk dead-ended to false and sent the
    // item down the object-field init path that strips its _key/_type.
    it('returns true for a member nested inside another array item (array-in-array)', () => {
      expect(isMember(['pageBuilder', {_key: 'a'}, 'sections', {_key: 'b'}])).toBe(true)
    })
  })

  describe('object fields (false)', () => {
    it('returns false for a top-level object field', () => {
      expect(isMember(['myTable'])).toBe(false)
    })

    it('returns false for a richTable object field inside an array item (SAPP-3812 repro)', () => {
      // pageBuilder → tableBlock item → `tableContent` field: a field nested in a
      // member, NOT a member itself, so it takes the plain-object-field init.
      expect(isMember(['pageBuilder', {_key: 'abc'}, 'tableContent'])).toBe(false)
    })

    it('returns false for an object field nested through an object inside an array item', () => {
      expect(isMember(['pageBuilder', {_key: 'abc'}, 'group', 'tableContent'])).toBe(false)
    })

    it('returns false for a field nested several object levels deep', () => {
      expect(isMember(['wrapper', 'layout', 'tableContent'])).toBe(false)
    })
  })

  describe('excluded contexts (false)', () => {
    it('returns false when isInPortableText is true (handled on its own branch)', () => {
      expect(isMember(['pageBuilder', {_key: 'abc'}], true)).toBe(false)
    })

    it('returns false for an empty path', () => {
      expect(isMember([])).toBe(false)
    })
  })
})
