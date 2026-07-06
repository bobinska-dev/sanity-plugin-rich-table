const ROW_COLUMN_WIDTH = 2 // in rem
const CONTENT_COLUMN_MIN_WIDTH = 80 // in px

const rowTitleColumnTrack = '1fr'
const rowContextColumnTrack = `${ROW_COLUMN_WIDTH}rem`
// Columns the editor has sized become a fixed px track; the rest share the
// leftover space equally but never collapse below a readable minimum.
export const CONTENT_COLUMN_DEFAULT_TRACK = `minmax(${CONTENT_COLUMN_MIN_WIDTH}px, 1fr)`

interface GridColumnTemplateOptions {
  /** Total grid columns including the leading row-title / context-menu column. */
  columnCount: number
  /** When true the leading column stretches for row titles, otherwise it's a
   * narrow fixed track for the row context menu. */
  hasRowTitles?: boolean
  /** Per content-column width in px; `undefined` entries fall back to the default
   * track. Index-aligned with the column headers. */
  columnWidths?: Array<number | undefined>
}

/**
 * Builds the `grid-template-columns` track list for the table: a leading column
 * for row titles / the context menu, followed by one track per content column —
 * fixed px where the editor has sized it, the shared default otherwise.
 */
export const buildGridColumnTemplate = ({
  columnCount,
  hasRowTitles,
  columnWidths,
}: GridColumnTemplateOptions): string => {
  const firstColumn = hasRowTitles ? rowTitleColumnTrack : rowContextColumnTrack
  if (!columnCount) {
    return `${firstColumn} repeat(4, 1fr)`
  }
  // the first column is the row title / context menu, the rest are content columns
  const contentColumnCount = columnCount - 1
  if (contentColumnCount < 1) {
    return firstColumn
  }
  const contentTracks = Array.from({length: contentColumnCount}, (_, i) => {
    const width = columnWidths?.[i]
    // Only a finite, positive width is a usable px track; anything else
    // (undefined, 0, negative, NaN) shares the default flexible track.
    const isSized = typeof width === 'number' && Number.isFinite(width) && width > 0
    return isSized ? `${width}px` : CONTENT_COLUMN_DEFAULT_TRACK
  }).join(' ')
  return `${firstColumn} ${contentTracks}`
}
