import {ComponentType} from 'react'
import {
  type BlockAnnotationProps,
  type BlockProps,
  definePlugin,
  type LayoutProps,
  useSchema,
} from 'sanity'

import {TableImportProvider} from './import/TableImportContext'
import {tableImportFieldAction} from './import/tableImportFieldAction'
import {findRecursiveCellType} from './portable-text/findRecursiveCellType'
import {defineCellObject, RichTableCellType} from './schemas/cell.object'
import columnHeaderObject, {ColumnHeader} from './schemas/columnHeader.object'
import {defineContentArrayMember} from './schemas/content'
import {defineRichTableBlock} from './schemas/richTable.block'
import {defineRichTableObject, RichTableType} from './schemas/richTable.object'
import {
  type RichTableRuleBuilder,
  richTableRules,
  type RichTableValidationConfig,
  richTableValidator,
} from './schemas/richTableValidation'
import rowObject, {RichTableRowType} from './schemas/row.object'

// Re-export types for consumers
export type {ColumnHeader, RichTableCellType, RichTableRowType, RichTableType}

// Per-instance validation. Preferred: the chainable, table-scoped rule builder —
// `validation: richTableRules().minRows(2).requireColumnTitles()`. Also exposed:
// `richTableValidator(config)` for composing inside your own `Rule.custom`.
export {richTableRules, richTableValidator}
export type {RichTableRuleBuilder, RichTableValidationConfig}

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

// ---------------------------------------------------------------------------
// Rendering helpers
//
// `toMarkdownTable` serializes a stored `richTable` value into a GitHub-flavored
// Markdown table string — the inverse of `parseMarkdownTable`. Handy for
// exporting a table, feeding it to an LLM, or rendering to Markdown/MDX.
// ---------------------------------------------------------------------------
export {toMarkdownTable, type ToMarkdownTableOptions} from './utils/toMarkdownTable'

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
 *
 * It also fails fast on a **recursive cell schema**: if the type passed as
 * `portableTextSchemaTypeName` includes a rich table among its members, a cell
 * could contain a table containing cells containing tables… — infinite nesting
 * that otherwise crashes Sanity's schema normalization with an opaque "Maximum
 * call stack size exceeded". Running the check in the layout surfaces a clear,
 * actionable error at studio load, before that crash can happen.
 */
function RichTableStudioLayout(props: LayoutProps & {portableTextSchemaTypeName?: string}) {
  const schema = useSchema()
  const recursiveType = findRecursiveCellType(schema, props.portableTextSchemaTypeName)
  if (recursiveType) {
    throw new Error(
      `[sanity-plugin-rich-table] The Portable Text type "${props.portableTextSchemaTypeName}" ` +
        `used for table cell content includes "${recursiveType}", which is a rich table. ` +
        `A table cell cannot contain a table — this nests the schema infinitely and crashes ` +
        `Sanity with "Maximum call stack size exceeded". Remove richTable / richTableBlock from ` +
        `the "of" array of "${props.portableTextSchemaTypeName}".`,
    )
  }
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
  ({portableTextSchemaTypeName}) => {
    // Bind the option into the layout once (the factory runs once per plugin
    // instantiation, so this component identity is stable) so the layout can
    // run its recursive-cell-schema guard against the configured type.
    const StudioLayout = (props: LayoutProps) => (
      <RichTableStudioLayout {...props} portableTextSchemaTypeName={portableTextSchemaTypeName} />
    )

    return {
      name: 'rich-table',
      title: 'Rich Table Plugin',

      schema: {
        types: [
          defineRichTableObject({portableTextSchemaTypeName}),
          rowObject,
          defineCellObject({portableTextSchemaTypeName}),
          columnHeaderObject,
          defineRichTableBlock({portableTextSchemaTypeName}),
          defineContentArrayMember(),
        ],
      },

      studio: {
        components: {
          layout: StudioLayout,
        },
      },

      document: {
        // Adds an "Import table" entry to the field-actions menu of rich-table
        // fields. `unstable_fieldActions` is the only field-actions API Sanity
        // exposes today.
        unstable_fieldActions: (prev) => [...prev, tableImportFieldAction],
      },
    }
  },
)
