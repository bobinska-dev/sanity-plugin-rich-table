import {defineArrayMember, definePlugin} from 'sanity'

import {setAdditionalBlockObjects} from './pluginConfig'
import {
  CellContentSchema,
  createCellObject,
  createCellObjectWithSchema,
  createCellObjectWithTypeName,
  RichTableCellType,
} from './schemas/cell.object'
import columnHeaderObject, {ColumnHeader} from './schemas/columnHeader.object'
import richTableBlock from './schemas/richTable.block'
import richTableObject, {RichTableType} from './schemas/richTable.object'
import rowObject, {RichTableRowType} from './schemas/row.object'

export type {RichTableType, RichTableRowType, RichTableCellType, ColumnHeader}

interface RichTablePluginOptions {
  /**
   * Schema for cell content. Can be:
   * - A string type name referencing an existing schema type (e.g. 'myBlockContent')
   * - An object with { type: 'array', of: [...] } for inline definition
   */
  cellContentSchema?: string | CellContentSchema
}

export const richTablePlugin = definePlugin<RichTablePluginOptions>((options) => {
  console.log('[rich-table] richTablePlugin called with options:', options)

  // Extract block objects from schema for the PTE editor (only for inline object definitions)
  if (options?.cellContentSchema && typeof options.cellContentSchema === 'object') {
    const schema = options.cellContentSchema as CellContentSchema
    if (schema.of?.length) {
      const blockObjects = schema.of
        .filter((member) => {
          const m = member as any
          return m.type !== 'block'
        })
        .map((member) => {
          const m = member as any
          return {
            name: (m.name ?? m.type) as string,
            title: m.title as string | undefined,
            fields: m?.type?.fields ?? m?.fields ?? [],
          }
        })
      setAdditionalBlockObjects(blockObjects)
    }
  }

  // Create the cell object based on the schema option type
  let cellObject
  if (!options?.cellContentSchema) {
    cellObject = createCellObject()
  } else if (typeof options.cellContentSchema === 'string') {
    // String type name reference
    cellObject = createCellObjectWithTypeName(options.cellContentSchema)
  } else {
    // Inline object schema definition
    cellObject = createCellObjectWithSchema(options.cellContentSchema)
  }

  return {
    name: 'rich-table',
    title: 'Rich Table Plugin',
    schema: {
      types: [richTableObject, rowObject, columnHeaderObject, richTableBlock, cellObject],
    },
  }
})
