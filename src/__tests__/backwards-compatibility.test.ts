import {describe, expect, it} from 'vitest'

import {getPluginConfig, setPluginConfig} from '../config'
import cellObjectModule, {
  createCellObject,
  createCellObjectWithSchema,
  createCellObjectWithTypeName,
  createOriginalCellObject,
} from '../schemas/cell.object'

describe('Backwards Compatibility', () => {
  describe('config module', () => {
    it('defaults experimentalPortableTextCell to false', () => {
      // Reset to default
      setPluginConfig({experimentalPortableTextCell: false})

      const result = getPluginConfig()
      expect(result.experimentalPortableTextCell).toBe(false)
    })

    it('setPluginConfig updates the config to true', () => {
      setPluginConfig({experimentalPortableTextCell: true})
      expect(getPluginConfig().experimentalPortableTextCell).toBe(true)
    })

    it('setPluginConfig updates the config to false', () => {
      setPluginConfig({experimentalPortableTextCell: true})
      setPluginConfig({experimentalPortableTextCell: false})
      expect(getPluginConfig().experimentalPortableTextCell).toBe(false)
    })
  })
})

describe('Cell Schema Backwards Compatibility', () => {
  it('createOriginalCellObject uses type: content', () => {
    const cellObject = createOriginalCellObject()

    expect(cellObject.name).toBe('richTableCell')
    expect(cellObject.fields).toHaveLength(1)

    const contentField = cellObject.fields[0]
    expect(contentField.name).toBe('content')
    expect(contentField.type).toBe('content')
  })

  it('createCellObject uses inline array (experimental)', () => {
    const cellObject = createCellObject()

    expect(cellObject.name).toBe('richTableCell')
    expect(cellObject.fields).toHaveLength(1)

    const contentField = cellObject.fields[0]
    expect(contentField.name).toBe('content')
    expect(contentField.type).toBe('array')
  })

  it('createCellObjectWithTypeName uses custom type name', () => {
    const cellObject = createCellObjectWithTypeName('myCustomBlockContent')

    expect(cellObject.name).toBe('richTableCell')
    const contentField = cellObject.fields[0]
    expect(contentField.type).toBe('myCustomBlockContent')
  })

  it('createCellObjectWithSchema uses inline schema', () => {
    const cellObject = createCellObjectWithSchema({
      type: 'array',
      of: [{type: 'block'}],
    })

    expect(cellObject.name).toBe('richTableCell')
    const contentField = cellObject.fields[0]
    expect(contentField.type).toBe('array')
  })

  it('default export uses createOriginalCellObject', () => {
    expect(cellObjectModule.name).toBe('richTableCell')
    const contentField = cellObjectModule.fields[0]
    expect(contentField.type).toBe('content')
  })
})
