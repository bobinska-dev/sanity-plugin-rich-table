import {definePlugin} from 'sanity'

import {
  CellContentSchema,
  createCellObject,
  createCellObjectWithSchema,
  createCellObjectWithTypeName,
  RichTableCellType,
} from './schemas/cell.object'
import columnHeaderObject, {ColumnHeader} from './schemas/columnHeader.object'
import content from './schemas/content'
import richTableBlock from './schemas/richTable.block'
import richTableObject, {RichTableType} from './schemas/richTable.object'
import rowObject, {RichTableRowType} from './schemas/row.object'

export type {RichTableType, RichTableRowType, RichTableCellType, ColumnHeader, CellContentSchema}

interface RichTablePluginOptions {
  /**
   * Schema for cell content. Can be:
   * - A string type name referencing an existing schema type (e.g. 'myBlockContent')
   * - An object with { type: 'array', of: [...] } for inline definition
   */
  cellContentSchema?: string | CellContentSchema
}

export const richTablePlugin = definePlugin<RichTablePluginOptions>((options) => {
  // Create the cell object based on the schema option type
  let cellObject
  if (!options?.cellContentSchema) {
    cellObject = createCellObject()
  } else if (typeof options.cellContentSchema === 'string') {
    cellObject = createCellObjectWithTypeName(options.cellContentSchema)
  } else {
    cellObject = createCellObjectWithSchema(options.cellContentSchema)
  }

  return {
    name: 'rich-table',
    title: 'Rich Table Plugin',
    schema: {
      types: [richTableObject, rowObject, columnHeaderObject, richTableBlock, cellObject, content],
    },
  }
})
