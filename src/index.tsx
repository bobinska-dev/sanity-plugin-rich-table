import {ArrayDefinition, ArraySchemaType, definePlugin, defineType, PortableTextBlock} from 'sanity'

import createCellObject, {RichTableCellType} from './schemas/cell.object'
import columnHeaderObject, {ColumnHeader} from './schemas/columnHeader.object'
import content from './schemas/content'
import richTableBlock from './schemas/richTable.block'
import richTableObject, {RichTableType} from './schemas/richTable.object'
import rowObject, {RichTableRowType} from './schemas/row.object'

// Re-export types for consumers
export type {RichTableType, RichTableRowType, RichTableCellType, ColumnHeader}

interface RichTablePluginOptions {
  /** Custom portable text schema for table cell content */
  cellContentSchema?: ArraySchemaType<PortableTextBlock> | ArrayDefinition
}
/**
 * Rich Table Plugin for Sanity
 *
 * A comprehensive rich table solution for Sanity Studio with Portable Text support.
 *
 * Features:
 * - Rich table object type with customizable rows and columns
 * - Rich table block type for embedding tables in Portable Text
 * - Support for cell content using Portable Text blocks
 * - Portable Text goodies: floating toolbar, slash commands, markdown shortcuts, and emoji picker
 * - Optional row and column titles
 * - Context menus for adding, deleting, and moving rows and columns
 * - Expandable table dialog for better editing experience
 * - Dark and light mode support
 *
 * @example
 * Installation:
 * ```ts
 * import {defineConfig} from 'sanity'
 * import {richTablePlugin} from 'sanity-plugin-rich-table'
 *
 * export default defineConfig({
 *   // ...
 *   plugins: [richTablePlugin({})],
 * })
 * ```
 *
 * @example
 * As a field:
 * ```ts
 * defineField({
 *   name: 'myRichTable',
 *   title: 'My Rich Table',
 *   type: 'richTable',
 * })
 * ```
 *
 * @example
 * As a Portable Text block:
 * ```ts
 * defineArrayMember({
 *   name: 'richTableBlock',
 *   title: 'Rich Table Block',
 *   type: 'richTableBlock',
 * })
 * ```
 *
 * @see {@link https://github.com/bobinska-dev/sanity-plugin-rich-table} for full documentation
 */
export const richTablePlugin = definePlugin<RichTablePluginOptions>((options) => {
  // Create custom cell object using factory function
  const customCellObject = createCellObject(options?.cellContentSchema)

  // Build schema types array
  const schemaTypes: ReturnType<typeof defineType>[] = [
    richTableObject,
    rowObject,
    customCellObject,
    columnHeaderObject,
    richTableBlock,
  ]

  // Only add content schema if we're using the default (custom schemas should already be registered)
  if (!options?.cellContentSchema) {
    schemaTypes.push(content)
  }

  return {
    name: 'rich-table',
    title: 'Rich Table Plugin',

    schema: {
      types: schemaTypes,
    },
  }
})
