// src/__tests__/plugin.test.ts
import {describe, expect, test} from '@jest/globals'

import {richTablePlugin} from '../index'
import richTableObject from '../schemas/richTable.object'
import rowObject from '../schemas/row.object'
import cellObject from '../schemas/cell.object'
import columnHeaderObject from '../schemas/columnHeader.object'
import richTableBlock from '../schemas/richTable.block'
import content from '../schemas/content'

describe('richTablePlugin', () => {
  it('exports a plugin with expected name and title', () => {
    expect(richTablePlugin).toBeDefined()
    expect(richTablePlugin.name).toBe('rich-table')
    expect(richTablePlugin.title).toBe('Rich Table Plugin')
  })

  it('registers expected schema types', () => {
    expect(richTablePlugin.schema).toBeDefined()
    expect(Array.isArray(richTablePlugin.schema.types)).toBe(true)
    expect(richTablePlugin.schema.types).toEqual(
      expect.arrayContaining([
        richTableObject,
        rowObject,
        cellObject,
        columnHeaderObject,
        richTableBlock,
        content,
      ]),
    )
  })
})
