import {definePlugin} from 'sanity'

import {setPluginConfig} from './config'
import {
  CellContentSchema,
  createCellObject,
  createCellObjectWithSchema,
  createCellObjectWithTypeName,
  createOriginalCellObject,
  RichTableCellType,
} from './schemas/cell.object'
import columnHeaderObject, {ColumnHeader} from './schemas/columnHeader.object'
import content from './schemas/content'
import richTableBlock from './schemas/richTable.block'
import richTableObject, {RichTableType} from './schemas/richTable.object'
import rowObject, {RichTableRowType} from './schemas/row.object'

export type {CellContentSchema, ColumnHeader, RichTableCellType, RichTableRowType, RichTableType}

interface RichTablePluginOptions {
  /**
   * Schema for cell content. Can be:
   * - A string type name referencing an existing schema type (e.g. 'myBlockContent')
   * - An object with { type: 'array', of: [...] } for inline definition
   */
  cellContentSchema?: string | CellContentSchema
  /** Enable experimental PortableTextCell component */
  experimentalPortableTextCell?: boolean
}

export const richTablePlugin = definePlugin<RichTablePluginOptions>((options) => {
  const experimentalPortableTextCell = options?.experimentalPortableTextCell ?? false

  // Set plugin config for use in components
  setPluginConfig({experimentalPortableTextCell})

  // Create the cell object based on options
  let cellObject
  if (options?.cellContentSchema) {
    // Custom schema provided - use factory functions
    if (typeof options.cellContentSchema === 'string') {
      cellObject = createCellObjectWithTypeName(options.cellContentSchema)
    } else {
      cellObject = createCellObjectWithSchema(options.cellContentSchema)
    }
  } else if (experimentalPortableTextCell) {
    // Experimental mode - use inline array definition
    cellObject = createCellObject()
  } else {
    // Default - use original 'content' type reference
    cellObject = createOriginalCellObject()
  }

  return {
    name: 'rich-table',
    title: 'Rich Table Plugin',
    schema: {
      types: [richTableObject, rowObject, columnHeaderObject, richTableBlock, cellObject, content],
    },
  }
})
