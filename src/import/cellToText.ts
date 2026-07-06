import {toPlainText} from '@portabletext/toolkit'

import type {CellValue} from './types'

/**
 * Extracts plain text from a {@link CellValue}. Returns the string as-is for
 * plain cells, or uses `toPlainText` from `@portabletext/toolkit` to flatten
 * `PortableTextBlock[]` cells into a single string.
 *
 * Used wherever a string representation is needed: preview rendering, header
 * labels, row title extraction, and header-toggle promotion.
 */
export function cellToText(cell: CellValue | undefined): string {
  if (!cell) return ''
  if (typeof cell === 'string') return cell
  if (Array.isArray(cell)) return toPlainText(cell)
  return ''
}
