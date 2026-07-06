import {renderHook} from '@testing-library/react'
import type {ObjectSchemaType, Path} from 'sanity'
import {describe, expect, it} from 'vitest'

import {tableImportFieldAction} from '../tableImportFieldAction'

const baseProps = {
  documentId: 'doc-1',
  documentType: 'myDoc',
  path: ['myRichTable'] as Path,
  schemaType: {name: 'richTable'} as ObjectSchemaType,
}

describe('tableImportFieldAction', () => {
  it('returns a referentially stable action across re-renders (guards the render loop)', () => {
    // Sanity calls `useAction` on every field render; an unstable return drives
    // its machinery into a "Too many re-renders" loop. The item must be memoized.
    const {result, rerender} = renderHook((props) => tableImportFieldAction.useAction(props), {
      initialProps: baseProps,
    })
    const first = result.current
    rerender(baseProps)
    expect(result.current).toBe(first)
  })

  it('is hidden on non-rich-table fields', () => {
    const {result} = renderHook(() =>
      tableImportFieldAction.useAction({
        ...baseProps,
        schemaType: {name: 'string'} as ObjectSchemaType,
      }),
    )
    expect(result.current.hidden).toBe(true)
  })

  it('is visible with the import affordance on rich-table fields', () => {
    const {result} = renderHook(() => tableImportFieldAction.useAction(baseProps))
    expect(result.current.hidden).toBe(false)
    expect(result.current.type).toBe('action')
    expect(result.current.title).toBe('Import table')
  })

  it('is hidden on array members (they use the inline button instead)', () => {
    const {result} = renderHook(() =>
      tableImportFieldAction.useAction({
        ...baseProps,
        path: ['myRichTables', {_key: 'abc'}] as Path,
      }),
    )
    expect(result.current.hidden).toBe(true)
  })
})
