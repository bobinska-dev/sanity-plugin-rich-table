import {describe, expect, it, vi} from 'vitest'

import {
  richTableRules,
  richTableValidator,
  type RichTableValidationConfig,
} from '../schemas/richTableValidation'

/** The validator is a plain `Rule.custom` callback — run it directly. */
function run(config: RichTableValidationConfig, value: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return richTableValidator(config)(value as any, {} as any)
}

const col = (key: string, title?: string) => ({_key: key, title, cellIndex: 0})
const row = (key: string, title?: string) => ({_key: key, title})
const table = (over: Record<string, unknown> = {}) => ({
  rows: [row('r1', 'Row 1')],
  columnHeaders: [col('c1', 'Col 1')],
  hasRowTitles: true,
  hasColumnTitles: true,
  ...over,
})

describe('richTableValidation', () => {
  it('passes (true) when every rule is satisfied', () => {
    expect(
      run({minRows: 1, minColumns: 1, requireRowTitles: true, requireColumnTitles: true}, table()),
    ).toBe(true)
  })

  it('flags too few rows on the rows path', () => {
    const result = run({minRows: 2}, table({rows: [row('r1', 'Row 1')]}))
    expect(result).toEqual([{message: 'The table must have at least 2 rows.', path: ['rows']}])
  })

  it('flags too few columns on the columnHeaders path', () => {
    const result = run({minColumns: 3}, table({columnHeaders: [col('c1'), col('c2')]}))
    expect(result).toEqual([
      {message: 'The table must have at least 3 columns.', path: ['columnHeaders']},
    ])
  })

  it('uses singular units for a minimum of 1', () => {
    expect(run({minRows: 1}, table({rows: []}))).toEqual([
      {message: 'The table must have at least 1 row.', path: ['rows']},
    ])
  })

  it('requires column titles (targeting the blank ones) only when column titles are enabled', () => {
    const value = table({columnHeaders: [col('c1', 'Filled'), col('c2', '  '), col('c3')]})
    expect(run({requireColumnTitles: true}, value)).toEqual([
      {message: 'Column title is required.', path: ['columnHeaders', {_key: 'c2'}, 'title']},
      {message: 'Column title is required.', path: ['columnHeaders', {_key: 'c3'}, 'title']},
    ])
    // Disabled titles → nothing to require.
    expect(run({requireColumnTitles: true}, table({...value, hasColumnTitles: false}))).toBe(true)
  })

  it('requires row titles (targeting the blank ones) only when row titles are enabled', () => {
    const value = table({rows: [row('r1', 'Named'), row('r2')]})
    expect(run({requireRowTitles: true}, value)).toEqual([
      {message: 'Row title is required.', path: ['rows', {_key: 'r2'}, 'title']},
    ])
    expect(run({requireRowTitles: true}, table({...value, hasRowTitles: false}))).toBe(true)
  })

  it('accumulates errors across rules', () => {
    const result = run(
      {minRows: 2, requireColumnTitles: true},
      table({rows: [row('r1', 'Row 1')], columnHeaders: [col('c1')]}),
    )
    expect(result).toHaveLength(2)
  })

  it('treats a missing/empty table as zero rows and columns', () => {
    expect(run({minRows: 1, minColumns: 1}, undefined)).toEqual([
      {message: 'The table must have at least 1 row.', path: ['rows']},
      {message: 'The table must have at least 1 column.', path: ['columnHeaders']},
    ])
  })
})

describe('richTableRules (chainable builder)', () => {
  // Invoke the builder as a ValidationBuilder and capture the validator it hands
  // to `Rule.custom`, so we can assert the chained config was applied.
  function runChain(builder: (rule: never) => unknown, value: unknown) {
    const custom = vi.fn((fn) => fn)
    const validator = builder({custom} as never) as (v: unknown, c: unknown) => unknown
    expect(custom).toHaveBeenCalledOnce()
    return validator(value, {})
  }

  it('is a validation builder that emits a single Rule.custom', () => {
    const custom = vi.fn()
    richTableRules().minRows(2)({custom} as never)
    expect(custom).toHaveBeenCalledOnce()
  })

  it('accumulates chained constraints', () => {
    const result = runChain(
      richTableRules().minRows(2).requireColumnTitles(),
      table({rows: [row('r1', 'Row 1')], columnHeaders: [col('c1')]}),
    )
    expect(result).toEqual([
      {message: 'The table must have at least 2 rows.', path: ['rows']},
      {message: 'Column title is required.', path: ['columnHeaders', {_key: 'c1'}, 'title']},
    ])
  })

  it('does not mutate earlier links in the chain', () => {
    const base = richTableRules().minRows(2)
    base.minColumns(5) // returns a new builder; must not affect `base`
    expect(runChain(base, table({rows: [row('r1', 'Row 1')], columnHeaders: []}))).toEqual([
      {message: 'The table must have at least 2 rows.', path: ['rows']},
    ])
  })
})
