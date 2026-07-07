import {defineBehavior, effect, execute} from '@portabletext/editor/behaviors'
import type {MutableRefObject} from 'react'
import type {PortableTextBlock} from 'sanity'

import {detectFormat} from './detectFormat'
import {htmlPasteToBlocks} from './htmlPasteToBlocks'
import {isPureTablePaste} from './isPureTablePaste'
import {markdownPasteToBlocks} from './markdownPasteToBlocks'
import {parseHtmlTable} from './parseHtmlTable'
import {parseTsvTable} from './parseTsvTable'
import {resolveRichTableBlockName} from './resolveRichTableBlockName'
import {getToastForResult} from './toastMessages'
import {toRichTableBlock} from './toRichTableValue'
import type {ParseResult, TableFormat} from './types'

/**
 * Callback type for pushing toast notifications from within a behavior effect.
 * Passed via a React ref so the behavior can access the latest `useToast`
 * instance without being a React component itself.
 */
export type ShowToastFn = (payload: {
  title: string
  description: string
  status: 'success' | 'warning' | 'error'
  closable: boolean
}) => void

/**
 * Parsers used for the "pure table" intercept path (HTML and TSV pastes that
 * contain *only* tabular data).
 */
const PURE_TABLE_PARSERS: Record<'html' | 'tsv', (input: string) => ParseResult> = {
  html: parseHtmlTable,
  tsv: parseTsvTable,
}

/** Markdown table separator row: `| --- | :---: | ---: |`. */
const MD_TABLE_SEPARATOR = /^\s*\|[\s:|-]+\|\s*$/m

/**
 * Returns true if the given text contains at least one block-level markdown
 * signal — heading, list item, blockquote, fenced code, or table separator.
 *
 * We deliberately key off block-level *openers* and not inline marks like
 * `**bold**` or `[link](href)`. Inline patterns appear naturally in prose and
 * would produce false positives for ordinary plain-text pastes.
 */
function hasMarkdownBlockSignal(text: string): boolean {
  if (!text) return false
  return (
    /^#{1,6}\s/m.test(text) ||
    /^[-*+]\s/m.test(text) ||
    /^\d+\.\s/m.test(text) ||
    /^>\s/m.test(text) ||
    /^```/m.test(text) ||
    MD_TABLE_SEPARATOR.test(text)
  )
}

const isRichTableBlock = (block: unknown, blockType: string): boolean =>
  (block as {_type?: string})._type === blockType

/**
 * `clipboard.paste` interceptor for HTML/TSV pastes that are *only* a table.
 *
 * There is no built-in PTE deserialiser that produces a `richTable` block, so
 * we intercept the paste and insert a single block directly. Mixed pastes (a
 * table alongside prose) are handled by {@link createMixedTablePasteBehavior}.
 */
function createPureTablePasteBehavior(showToastRef: MutableRefObject<ShowToastFn | null>) {
  return defineBehavior({
    on: 'clipboard.paste',
    guard: ({event, snapshot}) => {
      const html = event.originEvent.dataTransfer.getData('text/html')
      const plain = event.originEvent.dataTransfer.getData('text/plain')

      const format = detectFormat(html, plain)
      if (!format || format === 'markdown') return false

      if (!isPureTablePaste(html, plain, format as TableFormat)) return false

      const parser = PURE_TABLE_PARSERS[format as 'html' | 'tsv']
      if (!parser) return false
      const input = format === 'html' ? html : plain
      const result = parser(input)
      if (!result || result.table.rows.length === 0) return false

      // Auto-detect the block's `_type` from the field's schema (honours a
      // renamed richTableBlock member) — never a hard-coded / passed-in name.
      const blockType = resolveRichTableBlockName(snapshot.context.schema)
      return {result, isRichFormat: format !== 'tsv', blockType}
    },
    actions: [
      (
        _,
        {
          result,
          isRichFormat,
          blockType,
        }: {result: ParseResult; isRichFormat: boolean; blockType: string},
      ) => [
        execute({
          type: 'insert.block',
          block: toRichTableBlock(
            result.table,
            undefined,
            blockType,
          ) as unknown as PortableTextBlock,
          placement: 'after',
          select: 'none',
        }),
        effect(() => {
          const showToast = showToastRef.current
          if (showToast) {
            showToast(getToastForResult(result, result.totalRows, isRichFormat))
          }
        }),
      ],
    ],
  })
}

/**
 * `clipboard.paste` interceptor for pastes that mix prose with one or more
 * tables:
 *
 * - **HTML** with a `<table>` (e.g. copied from a web page or document) →
 *   {@link htmlPasteToBlocks} keeps the prose and turns each table into a
 *   `richTable` block.
 * - **Markdown** carrying a table (plus any surrounding prose) →
 *   {@link markdownPasteToBlocks}.
 *
 * We intercept at `clipboard.paste` rather than `deserialize.data` because this
 * PTE version does not emit a `deserialize.data` behavior event for pastes —
 * the default deserialiser runs and flattens the table. `clipboard.paste` fires
 * reliably and exposes a populated `dataTransfer`.
 */
function createMixedTablePasteBehavior(showToastRef: MutableRefObject<ShowToastFn | null>) {
  return defineBehavior({
    on: 'clipboard.paste',
    guard: ({event, snapshot}) => {
      const html = event.originEvent.dataTransfer.getData('text/html')
      const plain = event.originEvent.dataTransfer.getData('text/plain')

      // Auto-detect the block's `_type` from the field's schema (honours a
      // renamed richTableBlock member) — never a hard-coded / passed-in name.
      const blockType = resolveRichTableBlockName(snapshot.context.schema)

      // HTML with a table mixed with prose. Pure HTML tables are handled by
      // createPureTablePasteBehavior (single block), so skip them here.
      if (html && /<table[\s>]/i.test(html) && !isPureTablePaste(html, plain, 'html')) {
        const blocks = htmlPasteToBlocks(html, blockType)
        const tableCount = blocks.filter((block) => isRichTableBlock(block, blockType)).length
        if (tableCount > 0) return {blocks, tableCount}
      }

      // Markdown carrying a table (with or without surrounding prose).
      if (plain && hasMarkdownBlockSignal(plain)) {
        const blocks = markdownPasteToBlocks(plain, blockType)
        const tableCount = blocks.filter((block) => isRichTableBlock(block, blockType)).length
        if (tableCount > 0) return {blocks, tableCount}
      }

      return false
    },
    actions: [
      (_, {blocks, tableCount}: {blocks: PortableTextBlock[]; tableCount: number}) => [
        execute({
          type: 'insert.blocks',
          blocks: blocks as unknown as PortableTextBlock[],
          placement: 'auto',
          select: 'end',
        }),
        effect(() => {
          const showToast = showToastRef.current
          if (showToast) {
            showToast({
              title: tableCount === 1 ? 'Table imported' : `${tableCount} tables imported`,
              description: 'Pasted content with rich table(s); surrounding text kept.',
              status: 'success',
              closable: true,
            })
          }
        }),
      ],
    ],
  })
}

/**
 * Returns the set of PTE behaviors that handle table-aware clipboard pastes:
 *
 * 1. Pure-table HTML/TSV → insert a single `richTable` block.
 * 2. Mixed HTML (prose + `<table>`) or markdown with a table → keep the prose
 *    and turn each table into a `richTable` block.
 *
 * The toast callback is passed via a React ref so each editor instance keeps
 * its own notification channel.
 *
 * The inserted block's `_type` is auto-detected per paste from the field's own
 * schema (see `resolveRichTableBlockName`), so a renamed `richTableBlock` member
 * is honoured with no configuration from the consumer.
 */
export function createTablePasteBehaviors(showToastRef: MutableRefObject<ShowToastFn | null>) {
  return [createPureTablePasteBehavior(showToastRef), createMixedTablePasteBehavior(showToastRef)]
}
