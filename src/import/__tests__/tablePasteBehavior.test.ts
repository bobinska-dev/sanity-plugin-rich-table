import type {MutableRefObject} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {createTablePasteBehaviors, type ShowToastFn} from '../tablePasteBehavior'
import {RICH_TABLE_BLOCK_TYPE} from '../toRichTableValue'

/**
 * Minimal structural view of the behaviors under test. `defineBehavior` is an
 * identity function in `@portabletext/editor`, so the guard/actions are plain
 * callables — we exercise them directly with a synthetic clipboard event + a
 * schema snapshot, rather than mounting an editor.
 */
interface TestBehavior {
  on: string
  guard: (arg: {
    event: {originEvent: {dataTransfer: {getData: (type: string) => string}}}
    snapshot: {context: {schema: unknown}}
  }) => unknown
  actions: Array<
    (
      snapshot: unknown,
      guarded: unknown,
    ) => Array<{type: string; effect?: () => void; event?: {block?: {_type?: string}}}>
  >
}

/**
 * A snapshot whose field schema registers the rich-table block under `blockName`
 * (carrying the rows+columnHeaders signature), so the behaviors auto-detect the
 * inserted block's `_type` from it — no option passed.
 */
const snapshotWith = (blockName: string = RICH_TABLE_BLOCK_TYPE) => ({
  context: {
    schema: {
      blockObjects: [
        {name: 'image', fields: [{name: 'asset'}]},
        {name: blockName, fields: [{name: 'rows'}, {name: 'columnHeaders'}]},
      ],
    },
  },
})

function makeArg({
  html = '',
  plain = '',
  blockName,
}: {
  html?: string
  plain?: string
  blockName?: string
}) {
  const getData = (type: string) => {
    if (type === 'text/html') return html
    if (type === 'text/plain') return plain
    return ''
  }
  return {event: {originEvent: {dataTransfer: {getData}}}, snapshot: snapshotWith(blockName)}
}

function makeBehaviors() {
  const showToastRef: MutableRefObject<ShowToastFn | null> = {current: vi.fn()}
  const [pure, mixed] = createTablePasteBehaviors(showToastRef) as unknown as [
    TestBehavior,
    TestBehavior,
  ]
  return {pure, mixed, showToastRef}
}

const isExecute = (c: {type: string}) => c.type === 'execute'
const isEffect = (c: {type: string}) => c.type === 'effect'

const MD_TABLE = ['| Name | Age |', '| --- | --- |', '| Alice | 30 |', '| Bob | 25 |'].join('\n')

describe('createTablePasteBehaviors', () => {
  it('returns two clipboard.paste behaviors', () => {
    const {pure, mixed} = makeBehaviors()
    expect(pure.on).toBe('clipboard.paste')
    expect(mixed.on).toBe('clipboard.paste')
  })

  it('pure: matches a tab-delimited paste and marks it non-rich', () => {
    const {pure} = makeBehaviors()
    const guarded = pure.guard(makeArg({plain: 'Name\tAge\nAlice\t30'})) as {
      isRichFormat: boolean
      result: unknown
    }
    expect(guarded).toBeTruthy()
    expect(guarded.isRichFormat).toBe(false)
  })

  it('pure: ignores markdown (handled by the mixed behavior)', () => {
    const {pure} = makeBehaviors()
    expect(pure.guard(makeArg({plain: MD_TABLE}))).toBe(false)
  })

  it('pure: ignores an empty clipboard', () => {
    const {pure} = makeBehaviors()
    expect(pure.guard(makeArg({}))).toBe(false)
  })

  it('pure: inserts a richTable block and fires a toast when activated', () => {
    const {pure, showToastRef} = makeBehaviors()
    const guarded = pure.guard(makeArg({plain: 'Name\tAge\nAlice\t30'}))
    expect(guarded).toBeTruthy()

    const commands = pure.actions[0](undefined, guarded)
    const insert = commands.find(isExecute)
    const sideEffect = commands.find(isEffect)

    expect(insert?.event?.block?._type).toBe(RICH_TABLE_BLOCK_TYPE)

    sideEffect?.effect?.()
    expect(showToastRef.current).toHaveBeenCalledTimes(1)
  })

  it('mixed: matches markdown that carries a table', () => {
    const {mixed} = makeBehaviors()
    const guarded = mixed.guard(makeArg({plain: `Intro.\n\n${MD_TABLE}`})) as {tableCount: number}
    expect(guarded).toBeTruthy()
    expect(guarded.tableCount).toBeGreaterThanOrEqual(1)
  })

  it('mixed: matches html prose mixed with a table', () => {
    const {mixed} = makeBehaviors()
    const html =
      '<p>A prose paragraph long enough to make this a mixed, non-pure paste.</p>' +
      '<table><tbody><tr><td>A</td><td>B</td></tr><tr><td>1</td><td>2</td></tr></tbody></table>'
    const guarded = mixed.guard(makeArg({html})) as {tableCount: number}
    expect(guarded).toBeTruthy()
    expect(guarded.tableCount).toBeGreaterThanOrEqual(1)
  })

  it('mixed: does not match plain prose with no block signal', () => {
    const {mixed} = makeBehaviors()
    expect(mixed.guard(makeArg({plain: 'just some words'}))).toBe(false)
  })

  it('pure: auto-detects a RENAMED block member from the schema (no option)', () => {
    const {pure} = makeBehaviors()
    const guarded = pure.guard(makeArg({plain: 'Name\tAge\nAlice\t30', blockName: 'richTable'}))
    expect(guarded).toBeTruthy()

    const commands = pure.actions[0](undefined, guarded)
    expect(commands.find(isExecute)?.event?.block?._type).toBe('richTable')
  })

  it('mixed: auto-detects a RENAMED block member for each table block', () => {
    const {mixed} = makeBehaviors()
    const guarded = mixed.guard(
      makeArg({plain: `Intro.\n\n${MD_TABLE}`, blockName: 'richTable'}),
    ) as {blocks: Array<{_type?: string}>; tableCount: number}
    expect(guarded).toBeTruthy()

    const tableBlocks = guarded.blocks.filter((b) => b._type === 'richTable')
    expect(tableBlocks.length).toBe(guarded.tableCount)
    expect(guarded.blocks.some((b) => b._type === RICH_TABLE_BLOCK_TYPE)).toBe(false)
  })
})
