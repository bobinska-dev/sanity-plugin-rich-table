import {ComponentType} from 'react'
import {type BlockAnnotationProps, type BlockProps, definePlugin, type LayoutProps} from 'sanity'

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

// Augment @sanity/types so ANY block-capable schema type used as a Portable Text
// member can carry the rich-table render slots: `components.tableBlock` (block
// objects), `components.tableInlineBlock` (inline objects) and
// `components.tableAnnotation` (annotations). All three are table-specific
// siblings of Sanity's standard `block`/`inlineBlock`/`annotation` slots — they
// leave the native slot for Sanity's default rendering (which the hidden native
// input uses for the edit form via onPathOpen, and for the debug/document view)
// while the cell editor renders the custom component. This matters because the
// native PTE renders annotations via `props.renderDefault`, which does NOT exist
// in `@portabletext/editor`'s render props (the cell editor gets the annotated
// text as `props.children`) — so a component authored for one breaks the other
// unless they live on separate slots. `tableBlock`/`tableInlineBlock` take
// `BlockProps`; `tableAnnotation` takes `BlockAnnotationProps`.
//
// These `*Components` interfaces are declared by the `sanity` package as its own
// augmentation of `@sanity/types`; merging into the same module here extends them
// (`sanity` re-exports the interfaces, so the merge reaches Studio code importing
// from `sanity`). We cover every object-like type Sanity gives these slots —
// object, image, reference, file, cross-dataset reference, geopoint — so
// consumers can attach the slots to whichever block/inline/annotation type they
// use. Styles/decorators need no augmentation: they use the native `component` field.
declare module '@sanity/types' {
  interface ObjectComponents {
    tableBlock?: ComponentType<BlockProps>
    tableInlineBlock?: ComponentType<BlockProps>
    tableAnnotation?: ComponentType<BlockAnnotationProps>
  }
  interface ImageComponents {
    tableBlock?: ComponentType<BlockProps>
    tableInlineBlock?: ComponentType<BlockProps>
    tableAnnotation?: ComponentType<BlockAnnotationProps>
  }
  interface ReferenceComponents {
    tableBlock?: ComponentType<BlockProps>
    tableInlineBlock?: ComponentType<BlockProps>
    tableAnnotation?: ComponentType<BlockAnnotationProps>
  }
  interface FileComponents {
    tableBlock?: ComponentType<BlockProps>
    tableInlineBlock?: ComponentType<BlockProps>
    tableAnnotation?: ComponentType<BlockAnnotationProps>
  }
  interface CrossDatasetReferenceComponents {
    tableBlock?: ComponentType<BlockProps>
    tableInlineBlock?: ComponentType<BlockProps>
    tableAnnotation?: ComponentType<BlockAnnotationProps>
  }
  interface GeopointComponents {
    tableBlock?: ComponentType<BlockProps>
    tableInlineBlock?: ComponentType<BlockProps>
    tableAnnotation?: ComponentType<BlockAnnotationProps>
  }
}

export interface RichTablePluginOptions {
  portableTextSchemaTypeName?: string
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
  ({portableTextSchemaTypeName}) => ({
    name: 'rich-table',
    title: 'Rich Table Plugin',

    schema: {
      types: [
        defineRichTableObject({portableTextSchemaTypeName}),
        rowObject,
        defineCellObject({portableTextSchemaTypeName}),
        columnHeaderObject,
        richTableBlock,
        defineContentArrayMember(),
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
