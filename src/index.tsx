import {defineArrayMember, definePlugin} from 'sanity'

import {setAdditionalBlockObjects} from './pluginConfig'
import cellObject, {RichTableCellType} from './schemas/cell.object'
import columnHeaderObject, {ColumnHeader} from './schemas/columnHeader.object'
import {createContentType} from './schemas/content'
import richTableBlock from './schemas/richTable.block'
import richTableObject, {RichTableType} from './schemas/richTable.object'
import rowObject, {RichTableRowType} from './schemas/row.object'

type ArrayMember = ReturnType<typeof defineArrayMember>

// Re-export types for consumers
export type {RichTableType, RichTableRowType, RichTableCellType, ColumnHeader}

interface RichTablePluginOptions {
  /**
   * Additional array members to include in cell content alongside the
   * default `block` type. Use this to add images, custom objects, etc.
   *
   * @example
   * ```ts
   * richTablePlugin({
   *   cellContentAdditionalMembers: [
   *     defineArrayMember({
   *       type: 'image',
   *       name: 'image',
   *       title: 'Image',
   *       options: {hotspot: true},
   *     }),
   *   ],
   * })
   * ```
   */
  cellContentAdditionalMembers?: ArrayMember[]

  /**
   * Override properties on the default `block` member (e.g. custom styles,
   * marks, decorators, annotations). Merged on top of the defaults.
   *
   * @example
   * ```ts
   * richTablePlugin({
   *   cellContentBlockOverrides: {
   *     styles: [
   *       {title: 'Normal', value: 'normal'},
   *       {title: 'H2', value: 'h2'},
   *     ],
   *     marks: {
   *       decorators: [
   *         {title: 'Bold', value: 'strong'},
   *         {title: 'Italic', value: 'em'},
   *       ],
   *       annotations: [
   *         {
   *           name: 'link',
   *           type: 'object',
   *           title: 'Link',
   *           fields: [{name: 'href', type: 'url', title: 'URL'}],
   *         },
   *       ],
   *     },
   *   },
   * })
   * ```
   */
  cellContentBlockOverrides?: Record<string, unknown>
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
  // Cache additional block objects at module level so the PTE editor can read them
  // without needing to resolve from Sanity's schema registry.
  if (options?.cellContentAdditionalMembers) {
    setAdditionalBlockObjects(
      options.cellContentAdditionalMembers.map((member) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m = member as any
        return {
          name: (m.name ?? m.type) as string,
          title: m.title as string | undefined,
          fields: [],
        }
      }),
    )
  }

  return {
    name: 'rich-table',
    title: 'Rich Table Plugin',

    schema: {
      types: [
        richTableObject,
        rowObject,
        cellObject,
        columnHeaderObject,
        richTableBlock,
        createContentType(options?.cellContentAdditionalMembers, options?.cellContentBlockOverrides),
      ],
    },
  }
})
