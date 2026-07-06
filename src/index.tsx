import {ComponentType} from 'react'
import {
  definePlugin,
  ImageDefinition,
  type LayoutProps,
  ObjectDefinition,
  ReferenceDefinition,
} from 'sanity'

import {TableImportProvider} from './import/TableImportContext'
import {tableImportFieldAction} from './import/tableImportFieldAction'
import {defineCellObject, RichTableCellType} from './schemas/cell.object'
import columnHeaderObject, {ColumnHeader} from './schemas/columnHeader.object'
import {defineContentArrayMember} from './schemas/content'
import richTableBlock from './schemas/richTable.block'
import {defineRichTableObject, RichTableType} from './schemas/richTable.object'
import rowObject, {RichTableRowType} from './schemas/row.object'

// Re-export types for consumers
export type {ColumnHeader, RichTableCellType, RichTableRowType, RichTableType}

// ---------------------------------------------------------------------------
// Table-import feature — public API
//
// The parsers + `toRichTableValue` are UI-agnostic and produce the `richTable`
// value shape, so consumers can build custom import flows. `RichTablePastePlugin`
// enables "paste a table into a document-body Portable Text field → richTable
// block"; `TableImportDialog` is the paste/upload dialog used by the built-in
// field action and inline block button.
//
// NOTE: `parseXlsxTable` is intentionally NOT re-exported here — it statically
// imports the optional `xlsx` package, so re-exporting it would eagerly load
// `xlsx` for every consumer (breaking graceful degradation when it's absent).
// Use `parseFile` (which lazy-imports the XLSX parser) for Excel input instead.
// ---------------------------------------------------------------------------
export {detectFormat} from './import/detectFormat'
export {markdownPasteToBlocks} from './import/markdownPasteToBlocks'
export {parseCsvTable} from './import/parseCsvTable'
export {ACCEPTED_FILE_EXTENSIONS, parseFile} from './import/parseFile'
export {parseHtmlTable} from './import/parseHtmlTable'
export {parseMarkdownTable} from './import/parseMarkdownTable'
export {parseTsvTable} from './import/parseTsvTable'
export {TableImportDialog} from './import/TableImportDialog'
export {createTablePasteBehaviors, type ShowToastFn} from './import/tablePasteBehavior'
export {RichTablePastePlugin} from './import/TablePastePlugin'
export {
  RICH_TABLE_BLOCK_TYPE,
  type RichTableValue,
  toRichTableBlock,
  toRichTableValue,
} from './import/toRichTableValue'
export {
  type CellValue,
  MAX_IMPORT_ROWS,
  type ParsedTable,
  type ParseResult,
  type ParseWarning,
  type TableFormat,
  type ToRichTableOptions,
  type XlsxParseResult,
} from './import/types'

// Augment @sanity/types so object/image array members can specify a
// `components.tableBlock` render component (used for custom blocks/images) and
// inline objects a `components.tableInlineBlock`. Both are table-specific
// siblings of Sanity's standard slots: they leave the native slot (`block` /
// `inlineBlock`) for Sanity's default rendering — which the hidden native input
// uses for the edit form (onPathOpen) — while the cell editor renders the
// custom component. Marks need no augmentation: styles/decorators use Sanity's
// native `component` field and annotations use its native `components.annotation`.
declare module '@sanity/types' {
  interface ImageComponents {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tableBlock?: ComponentType<any>
  }
  interface ObjectComponents {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tableBlock?: ComponentType<any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tableInlineBlock?: ComponentType<any>
  }
}

interface CustomBlockType {
  // TODO: adjust type so that helper functions work
  type: ObjectDefinition | ImageDefinition | ReferenceDefinition
  icon: ComponentType
  defaultValues?: Record<string, unknown>
}
export interface RichTablePluginOptions {
  portableTextSchemaTypeName?: string
  // TODO: add more configs or try complete PT schema customisation
  customBlockTypes?: Array<CustomBlockType>
  customInlineBlockTypes?: Array<CustomBlockType>
}

/**
 * Mounts the {@link TableImportProvider} once around the whole studio so the
 * rich-table import field action can open the dialog rendered by each field's
 * input.
 */
function RichTableStudioLayout(props: LayoutProps) {
  return <TableImportProvider>{props.renderDefault(props)}</TableImportProvider>
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
export const richTablePlugin = definePlugin<RichTablePluginOptions>(
  ({customBlockTypes, customInlineBlockTypes, portableTextSchemaTypeName}) => ({
    name: 'rich-table',
    title: 'Rich Table Plugin',

    schema: {
      types: [
        defineRichTableObject({portableTextSchemaTypeName}),
        rowObject,
        defineCellObject({portableTextSchemaTypeName}),
        columnHeaderObject,
        richTableBlock,
        defineContentArrayMember({customBlockTypes, customInlineBlockTypes}),
      ],
    },

    studio: {
      components: {
        layout: RichTableStudioLayout,
      },
    },

    document: {
      // Adds an "Import table" entry to the field-actions menu of rich-table
      // fields. `unstable_fieldActions` is the only field-actions API Sanity
      // exposes today.
      unstable_fieldActions: (prev) => [...prev, tableImportFieldAction],
    },
  }),
)
