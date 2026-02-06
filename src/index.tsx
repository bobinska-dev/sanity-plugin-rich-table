import {definePlugin, ImageDefinition, ObjectDefinition} from 'sanity'
import {ComponentType} from 'react'

import cellObject, {RichTableCellType} from './schemas/cell.object'
import columnHeaderObject, {ColumnHeader} from './schemas/columnHeader.object'
import {defineContentArrayMember} from './schemas/content'
import richTableBlock from './schemas/richTable.block'
import richTableObject, {RichTableType} from './schemas/richTable.object'
import rowObject, {RichTableRowType} from './schemas/row.object'

// Re-export types for consumers
export type {RichTableType, RichTableRowType, RichTableCellType, ColumnHeader}

interface CustomBlockType {
  // TODO: adjust type so that helper functions work
  type: ObjectDefinition | ImageDefinition
  icon: ComponentType
  defaultValues?: Record<string, unknown>
}
export interface RichTablePluginOptions {
  // TODO: add more configs or try complete PT schema customisation
  customBlockTypes?: Array<CustomBlockType>
  customInlineBlockTypes?: Array<CustomBlockType>
}

/** # Rich Table Plugin for Sanity by Saskia Bobinska
 *
 * WIP!!!
 * This plugin adds a rich table object type and block type to your schemas.
 * It allows users to create and manage rich tables both in documents and in Portable Text.
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
export const richTablePlugin = definePlugin<RichTablePluginOptions>(({customBlockTypes, customInlineBlockTypes}) => ({
  name: 'rich-table',
  title: 'Rich Table Plugin',

  schema: {
    types: [
      richTableObject,
      rowObject,
      cellObject,
      columnHeaderObject,
      richTableBlock,
      defineContentArrayMember({customBlockTypes, customInlineBlockTypes}),
    ],
  },
}))
