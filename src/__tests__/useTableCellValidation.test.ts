import {renderHook} from '@testing-library/react'
import type {Path, ValidationMarker} from 'sanity'
import {beforeEach, describe, expect, it, vi} from 'vitest'

// The document pane is the marker source; make its validation list controllable.
let mockValidation: ValidationMarker[] = []
vi.mock('sanity/structure', () => ({
  useDocumentPane: () => ({validation: mockValidation}),
}))

// Only the data source is mocked; `pathToString` + the level predicates use
// faithful implementations so the hook's real bucketing logic is exercised.
vi.mock('sanity', () => ({
  pathToString: (path: unknown[]) =>
    path
      .map((seg, i) => {
        if (typeof seg === 'string') return i === 0 ? seg : `.${seg}`
        if (typeof seg === 'number') return `[${seg}]`
        if (seg && typeof seg === 'object' && '_key' in (seg as object))
          return `[_key=="${(seg as {_key: string})._key}"]`
        return `[${JSON.stringify(seg)}]`
      })
      .join(''),
  isValidationErrorMarker: (m: {level: string}) => m.level === 'error',
  isValidationWarningMarker: (m: {level: string}) => m.level === 'warning',
  isKeySegment: (seg: unknown) => Boolean(seg && typeof seg === 'object' && '_key' in seg),
}))

import {invalidAnnotationKeysFrom, useTableCellValidation} from '../hooks/useTableCellValidation'

const marker = (
  level: ValidationMarker['level'],
  path: Path,
  message: string = level,
): ValidationMarker => ({level, message, path})

// rows/cells key off `_key`; the failing link URL sits deep in the cell content.
const cellA = ['myTable', 'rows', {_key: 'r1'}, 'cells', {_key: 'c1'}]
const cellB = ['myTable', 'rows', {_key: 'r1'}, 'cells', {_key: 'c2'}]
const urlInCellA = [...cellA, 'content', {_key: 'b1'}, 'markDefs', {_key: 'm1'}, 'href']

function lookup() {
  return renderHook(() => useTableCellValidation()).result.current
}

describe('useTableCellValidation', () => {
  beforeEach(() => {
    mockValidation = []
  })

  it('matches a deep markDef marker to its containing cell', () => {
    mockValidation = [marker('error', urlInCellA, 'Does not match allowed protocols/schemes')]
    const {markers, tone} = lookup()(cellA)
    expect(markers).toHaveLength(1)
    expect(tone).toBe('critical')
  })

  it('does not leak a marker into a sibling cell', () => {
    mockValidation = [marker('error', urlInCellA)]
    expect(lookup()(cellB).markers).toHaveLength(0)
    expect(lookup()(cellB).tone).toBeUndefined()
  })

  it('matches a marker sitting exactly at the queried path', () => {
    mockValidation = [marker('warning', cellA)]
    expect(lookup()(cellA).markers).toHaveLength(1)
  })

  it('guards path boundaries so a prefix string does not over-match', () => {
    // `rows` must not match a sibling field like `rowsBackup`, and `[0]` must
    // not match `[10]`.
    mockValidation = [
      marker('error', ['myTable', 'rowsBackup', {_key: 'r1'}]),
      marker('error', ['myTable', 'grid', 0, 'x']),
    ]
    expect(lookup()(['myTable', 'rows']).markers).toHaveLength(0)
    expect(lookup()(['myTable', 'grid', 10]).markers).toHaveLength(0)
    // sanity check the positive case still lands
    expect(lookup()(['myTable', 'grid', 0]).markers).toHaveLength(1)
  })

  it('prefers critical over caution when both errors and warnings are present', () => {
    mockValidation = [marker('warning', urlInCellA), marker('error', urlInCellA)]
    expect(lookup()(cellA).tone).toBe('critical')
  })

  it('reports caution for warnings only and undefined for info only', () => {
    mockValidation = [marker('warning', urlInCellA)]
    expect(lookup()(cellA).tone).toBe('caution')
    mockValidation = [marker('info', urlInCellA)]
    expect(lookup()(cellA).tone).toBeUndefined()
    expect(lookup()(cellA).markers).toHaveLength(1)
  })
})

describe('invalidAnnotationKeysFrom', () => {
  it('extracts the markDef key from an error marker path', () => {
    const keys = invalidAnnotationKeysFrom([marker('error', urlInCellA)])
    expect([...keys]).toEqual(['m1'])
  })

  it('ignores non-error markers (warning / info do not redden the annotation)', () => {
    const keys = invalidAnnotationKeysFrom([
      marker('warning', urlInCellA),
      marker('info', urlInCellA),
    ])
    expect(keys.size).toBe(0)
  })

  it('ignores keyed segments that are not markDef children', () => {
    // A block-level error (no markDefs segment) must not mark any annotation.
    const keys = invalidAnnotationKeysFrom([marker('error', [...cellA, 'content', {_key: 'b1'}])])
    expect(keys.size).toBe(0)
  })

  it('collects distinct keys across multiple erroring annotations', () => {
    const otherUrl = [...cellB, 'content', {_key: 'b2'}, 'markDefs', {_key: 'm2'}, 'href']
    const keys = invalidAnnotationKeysFrom([marker('error', urlInCellA), marker('error', otherUrl)])
    expect(new Set(keys)).toEqual(new Set(['m1', 'm2']))
  })
})
