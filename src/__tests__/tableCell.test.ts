import type {Path} from 'sanity'
import {describe, expect, it} from 'vitest'

import {arePropsEqual, type TableCellProps} from '../components/TableCell'

// A referentially-stable stand-in for each opaque prop. The comparator only ever
// checks identity for these, so plain objects are enough.
const value = [{_type: 'block', _key: 'b', children: []}] as unknown as TableCellProps['value']
const schemaType = {name: 'content'} as unknown as TableCellProps['schemaType']
const onChange = ((): void => undefined) as unknown as TableCellProps['onChange']
const getCellValidation = (() => ({
  markers: [],
  tone: undefined,
})) as TableCellProps['getCellValidation']

// Distinct-identity alternates, to assert that an identity change re-renders.
const onChange2 = ((): void => undefined) as unknown as TableCellProps['onChange']
const schemaType2 = {name: 'content'} as unknown as TableCellProps['schemaType']
const getCellValidation2 = (() => ({
  markers: [],
  tone: undefined,
})) as TableCellProps['getCellValidation']

const base = (): TableCellProps => ({
  pteePath: ['rows', {_key: 'r'}, 'cells', {_key: 'c'}, 'content'] as Path,
  pathKey: 'rows[_key=="r"].cells[_key=="c"].content',
  cellPath: ['rows', {_key: 'r'}, 'cells', {_key: 'c'}] as Path,
  value,
  schemaType,
  onChange,
  readOnly: false,
  portableTextSchemaTypeName: 'content',
  displayInlineChanges: false,
  getCellValidation,
  rowIndex: 0,
  cellIndex: 0,
})

describe('TableCell arePropsEqual', () => {
  it('skips re-render when every render-affecting input is unchanged', () => {
    expect(arePropsEqual(base(), base())).toBe(true)
  })

  it('ignores form-node Path identity churn (same pathKey, new array refs)', () => {
    // Sanity rebuilds Path arrays with fresh identity each render; a cell that
    // did not move must still skip.
    const next = {
      ...base(),
      pteePath: ['rows', {_key: 'r'}, 'cells', {_key: 'c'}, 'content'] as Path,
      cellPath: ['rows', {_key: 'r'}, 'cells', {_key: 'c'}] as Path,
    }
    expect(arePropsEqual(base(), next)).toBe(true)
  })

  it('re-renders when the content value reference changes', () => {
    const next = {...base(), value: [...(value ?? [])]}
    expect(arePropsEqual(base(), next)).toBe(false)
  })

  it('re-renders when the cell moves (pathKey changes)', () => {
    expect(
      arePropsEqual(base(), {...base(), pathKey: 'rows[_key=="r2"].cells[_key=="c"].content'}),
    ).toBe(false)
  })

  it('re-renders when validation changes (getCellValidation identity changes)', () => {
    expect(arePropsEqual(base(), {...base(), getCellValidation: getCellValidation2})).toBe(false)
  })

  it('re-renders when readOnly / schema / flags change', () => {
    expect(arePropsEqual(base(), {...base(), readOnly: true})).toBe(false)
    expect(arePropsEqual(base(), {...base(), displayInlineChanges: true})).toBe(false)
    expect(arePropsEqual(base(), {...base(), portableTextSchemaTypeName: 'other'})).toBe(false)
    expect(arePropsEqual(base(), {...base(), schemaType: schemaType2})).toBe(false)
    expect(arePropsEqual(base(), {...base(), onChange: onChange2})).toBe(false)
    expect(arePropsEqual(base(), {...base(), rowIndex: 1})).toBe(false)
    expect(arePropsEqual(base(), {...base(), cellIndex: 1})).toBe(false)
  })
})
