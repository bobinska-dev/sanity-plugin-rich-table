import {memo} from 'react'
import {type ArraySchemaType, type InputProps, type Path, type PortableTextBlock} from 'sanity'

import type {CellValidation} from '../hooks/useTableCellValidation'
import ContentPortableTextInput from '../portable-text/ContentPortableTextEditor'
import {CellErrorBoundary} from './CellErrorBoundary'

export interface TableCellProps {
  /** Absolute form path to the cell's `content` array — what the editor patches through. */
  pteePath: Path
  /**
   * `pathToString(pteePath)` — the stable comparison key. Sanity's form-node
   * `Path` arrays can be rebuilt with a new identity on each render even when the
   * cell hasn't moved, so we compare the string, not the array reference. A cell's
   * key-based path is effectively immutable for its lifetime, so this rarely changes.
   */
  // Read by `arePropsEqual`, not the render body, so the react plugin can't see the use.
  // eslint-disable-next-line react/no-unused-prop-types
  pathKey: string
  /** The cell's own path (one segment up from `pteePath`), for the marker lookup. */
  cellPath: Path
  /**
   * The cell's Portable Text content — a slice of the immutable document value, so
   * it stays referentially stable for cells that didn't change (the signal that
   * lets an unchanged cell skip re-rendering while a sibling is edited).
   */
  value: PortableTextBlock[] | undefined
  schemaType: ArraySchemaType<PortableTextBlock>
  onChange: InputProps['onChange']
  readOnly?: boolean
  portableTextSchemaTypeName?: string
  displayInlineChanges?: boolean
  /**
   * Stable (`useCallback`) marker lookup; its identity changes only when the
   * document's validation changes, so it doubles as the "validation changed" signal
   * in the comparator. Called here (not in the parent) so the markers array —
   * freshly allocated on every call — doesn't become an unstable prop.
   */
  getCellValidation: (path: Path) => CellValidation
  rowIndex: number
  cellIndex: number
}

function TableCellComponent({
  pteePath,
  cellPath,
  value,
  schemaType,
  onChange,
  readOnly,
  portableTextSchemaTypeName,
  displayInlineChanges,
  getCellValidation,
  rowIndex,
  cellIndex,
}: TableCellProps) {
  const {markers, tone} = getCellValidation(cellPath)
  return (
    // Wrapped so a render crash in one cell (malformed content, a throwing custom
    // renderer) is contained and doesn't take down the whole table.
    <CellErrorBoundary label={`column ${cellIndex + 1}, row ${rowIndex + 1}`}>
      <ContentPortableTextInput
        onChange={onChange}
        path={pteePath}
        value={value}
        readOnly={readOnly}
        schemaType={schemaType}
        role="cell"
        portableTextSchemaTypeName={portableTextSchemaTypeName}
        displayInlineChanges={displayInlineChanges}
        validation={markers}
        validationTone={tone}
      />
    </CellErrorBoundary>
  )
}

/**
 * Re-render a cell ONLY when something that affects its render actually changed.
 * `Table` re-renders on every keystroke (the document value changes) and rebuilds
 * its member/props objects, so a naive render would re-mount-reconcile every cell's
 * editor on each character typed in any one cell. This comparator enumerates every
 * render-affecting input so nothing is silently stale:
 * - `pathKey`   — the cell's location (path array identity churns; the string doesn't)
 * - `value`     — the content itself (stable ref per unchanged cell)
 * - `schemaType`/`onChange`/`getCellValidation` — stable references; identity change = real change
 * - `readOnly`/`portableTextSchemaTypeName`/`displayInlineChanges` — primitive flags
 * - `rowIndex`/`cellIndex` — drive the error-boundary label
 */
export function arePropsEqual(prev: TableCellProps, next: TableCellProps): boolean {
  return (
    prev.pathKey === next.pathKey &&
    prev.value === next.value &&
    prev.schemaType === next.schemaType &&
    prev.onChange === next.onChange &&
    prev.readOnly === next.readOnly &&
    prev.portableTextSchemaTypeName === next.portableTextSchemaTypeName &&
    prev.displayInlineChanges === next.displayInlineChanges &&
    prev.getCellValidation === next.getCellValidation &&
    prev.rowIndex === next.rowIndex &&
    prev.cellIndex === next.cellIndex
  )
}

/** A memoized Portable Text table cell. See {@link arePropsEqual}. */
export const TableCell = memo(TableCellComponent, arePropsEqual)
