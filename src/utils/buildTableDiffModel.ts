import {portableTextToPlain} from './portableTextToPlain'

/** Structural state of a whole row or column. */
export type StructuralStatus = 'added' | 'removed' | 'moved' | 'unchanged'
/** State of an individual cell's content. */
export type CellDiffStatus = 'added' | 'removed' | 'changed' | 'unchanged'

export interface TableDiffCellModel {
  key: string
  status: CellDiffStatus
  fromText: string
  toText: string
  /** Raw Portable Text content (both revisions), for the detailed cell inspector. */
  fromContent: unknown
  toContent: unknown
}

export interface TableDiffColumnModel {
  /** Position used for the default letter label (A, B, C…); the column's `to` index, or `from` index if removed. */
  index: number
  status: StructuralStatus
  /** The column header title changed (shown visually, not counted as structural). */
  titleChanged: boolean
  fromTitle: string
  toTitle: string
}

export interface TableDiffRowModel {
  key: string
  /** Position used for the default number label (1, 2, 3…); the row's `to` index, or `from` index if removed. */
  index: number
  status: StructuralStatus
  /** The row title changed (shown visually, not counted as structural). */
  titleChanged: boolean
  fromTitle: string
  toTitle: string
  cells: TableDiffCellModel[]
}

export interface TableDiffModel {
  rows: TableDiffRowModel[]
  columns: TableDiffColumnModel[]
  /** Whether the (current) table shows column titles. */
  hasColumnTitles: boolean
  /** Whether the (current) table shows row titles. */
  hasRowTitles: boolean
  /** The `hasColumnTitles` flag was toggled between the two revisions. */
  columnTitlesToggled: boolean
  /** The `hasRowTitles` flag was toggled between the two revisions. */
  rowTitlesToggled: boolean
  hasChanges: boolean
  summary: {
    columnsAdded: number
    columnsRemoved: number
    columnsMoved: number
    rowsAdded: number
    rowsRemoved: number
    rowsMoved: number
    /** Cells whose content changed (excludes cells added/removed by a whole row/column change). */
    cellsChanged: number
  }
}

/** A permissive shape — diff values may be partial or malformed at runtime. */
type MaybeTable =
  | {rows?: unknown; columnHeaders?: unknown; hasColumnTitles?: unknown; hasRowTitles?: unknown}
  | null
  | undefined
type MaybeRow = {_key?: unknown; title?: unknown; cells?: unknown} | null | undefined
type MaybeCell = {_key?: unknown; content?: unknown} | null | undefined
type MaybeHeader = {_key?: unknown; title?: unknown; cellIndex?: unknown} | null | undefined

/** Internal descriptor aligning one column across both revisions by header identity. */
interface ColumnDescriptor {
  key: string
  fromIndex: number | null
  toIndex: number | null
  fromTitle: string
  toTitle: string
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function keyOf(value: {_key?: unknown} | null | undefined, fallback: string): string {
  return value && typeof value._key === 'string' && value._key ? value._key : fallback
}

/**
 * Recursively strip volatile `_key` fields and sort object keys so that two
 * structurally-equal values serialise identically regardless of key order.
 */
function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize)
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .filter((key) => key !== '_key')
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = normalize((value as Record<string, unknown>)[key])
        return acc
      }, {})
  }
  return value
}

function contentEquals(a: unknown, b: unknown): boolean {
  try {
    return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b))
  } catch {
    return a === b
  }
}

function maxCellsPerRow(rows: MaybeRow[]): number {
  return rows.reduce<number>((max, row) => Math.max(max, asArray<MaybeCell>(row?.cells).length), 0)
}

/** Longest common subsequence of two key arrays (used to detect moves). */
function longestCommonSubsequence(a: string[], b: string[]): string[] {
  const n = a.length
  const m = b.length
  const dp: number[][] = Array.from({length: n + 1}, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const result: string[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      result.push(a[i])
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++
    } else {
      j++
    }
  }
  return result
}

/**
 * Keys that exist in both revisions but whose relative order changed. Keys only
 * present on one side are ignored, so a deletion doesn't mark shifted siblings
 * as "moved".
 */
function movedKeys(fromKeys: string[], toKeys: string[]): Set<string> {
  const toSet = new Set(toKeys)
  const fromSet = new Set(fromKeys)
  const commonFromOrder = fromKeys.filter((key) => toSet.has(key))
  const commonToOrder = toKeys.filter((key) => fromSet.has(key))
  const stable = new Set(longestCommonSubsequence(commonFromOrder, commonToOrder))
  const moved = new Set<string>()
  for (const key of commonFromOrder) if (!stable.has(key)) moved.add(key)
  return moved
}

/**
 * Align columns across both revisions. Columns are identified by their
 * `columnHeaders[]._key` (falling back to position), so adding, removing or
 * moving a column is detected by identity rather than position. Cells that
 * extend beyond the declared headers are aligned positionally as a fallback.
 */
function buildColumnDescriptors(
  from: MaybeTable,
  to: MaybeTable,
  fromRows: MaybeRow[],
  toRows: MaybeRow[],
): ColumnDescriptor[] {
  const fromHeaders = asArray<MaybeHeader>(from?.columnHeaders)
  const toHeaders = asArray<MaybeHeader>(to?.columnHeaders)

  // If EITHER revision lacks column headers (legacy / header-less data), keying by
  // header `_key` on one side but positionally on the other would make every column
  // read as removed + added. Fall back to positional keys on BOTH sides so columns
  // align by index.
  const positional = fromHeaders.length === 0 || toHeaders.length === 0
  const columnKey = (header: MaybeHeader, index: number): string =>
    positional ? `@p${index}` : keyOf(header, `@h${index}`)

  const descriptors: ColumnDescriptor[] = []
  const byKey = new Map<string, ColumnDescriptor>()
  const ensure = (key: string): ColumnDescriptor => {
    let descriptor = byKey.get(key)
    if (!descriptor) {
      descriptor = {key, fromIndex: null, toIndex: null, fromTitle: '', toTitle: ''}
      byKey.set(key, descriptor)
      descriptors.push(descriptor)
    }
    return descriptor
  }

  // Current (to) columns first, in order, then removed (from-only) columns.
  toHeaders.forEach((header, index) => {
    const descriptor = ensure(columnKey(header, index))
    descriptor.toIndex = index
    descriptor.toTitle = asString(header?.title)
  })
  fromHeaders.forEach((header, index) => {
    const descriptor = ensure(columnKey(header, index))
    descriptor.fromIndex = index
    descriptor.fromTitle = asString(header?.title)
  })

  // Positional fallback for cells beyond the declared headers (keeps both sides aligned).
  for (let index = toHeaders.length; index < maxCellsPerRow(toRows); index++) {
    ensure(`@p${index}`).toIndex = index
  }
  for (let index = fromHeaders.length; index < maxCellsPerRow(fromRows); index++) {
    ensure(`@p${index}`).fromIndex = index
  }

  return descriptors
}

function structuralStatus(hasFrom: boolean, hasTo: boolean, moved: boolean): StructuralStatus {
  if (!hasFrom && hasTo) return 'added'
  if (hasFrom && !hasTo) return 'removed'
  if (moved) return 'moved'
  return 'unchanged'
}

function cellContentStatus(fromCell: MaybeCell, toCell: MaybeCell): CellDiffStatus {
  const hasFrom = fromCell !== undefined && fromCell !== null
  const hasTo = toCell !== undefined && toCell !== null
  if (!hasFrom && hasTo) return 'added'
  if (hasFrom && !hasTo) return 'removed'
  if (!hasFrom && !hasTo) return 'unchanged'
  return contentEquals(fromCell?.content, toCell?.content) ? 'unchanged' : 'changed'
}

/**
 * Cells for a single aligned row, one per aligned column. Returns how many cells
 * had genuine content edits (in columns present in both revisions) — cells that
 * changed only because a whole row/column was added or removed are not counted.
 */
function buildRowCells(
  rowStatus: StructuralStatus,
  fromCells: MaybeCell[],
  toCells: MaybeCell[],
  columns: ColumnDescriptor[],
  rowKey: string,
): {cells: TableDiffCellModel[]; changed: number} {
  const cells: TableDiffCellModel[] = []
  let changed = 0
  const rowPresentBoth = rowStatus !== 'added' && rowStatus !== 'removed'

  for (const column of columns) {
    const fromCell = column.fromIndex === null ? undefined : fromCells[column.fromIndex]
    const toCell = column.toIndex === null ? undefined : toCells[column.toIndex]
    const columnPresentBoth = column.fromIndex !== null && column.toIndex !== null

    let status: CellDiffStatus
    if (rowStatus === 'added') status = 'added'
    else if (rowStatus === 'removed') status = 'removed'
    else if (column.toIndex === null) status = 'removed'
    else if (column.fromIndex === null) status = 'added'
    else status = cellContentStatus(fromCell, toCell)

    // Only count genuine content edits in cells present in both revisions.
    if (rowPresentBoth && columnPresentBoth && status !== 'unchanged') changed++

    cells.push({
      key: keyOf(toCell, keyOf(fromCell, `${rowKey}:${column.key}`)),
      status,
      fromText: portableTextToPlain(fromCell?.content),
      toText: portableTextToPlain(toCell?.content),
      fromContent: fromCell?.content,
      toContent: toCell?.content,
    })
  }

  return {cells, changed}
}

/**
 * Build a defensive, render-ready model of the difference between two rich
 * table values. Rows are aligned by `_key`, columns by header `_key`; both
 * detect add/remove/move. The result never throws and always describes a
 * rectangular grid, so the diff view can render it safely.
 */
export function buildTableDiffModel(from: MaybeTable, to: MaybeTable): TableDiffModel {
  const fromRows = asArray<MaybeRow>(from?.rows)
  const toRows = asArray<MaybeRow>(to?.rows)

  const fromRowByKey = new Map<string, {row: MaybeRow; index: number}>()
  const fromRowKeys: string[] = []
  fromRows.forEach((row, index) => {
    const key = keyOf(row, `@${index}`)
    fromRowByKey.set(key, {row, index})
    fromRowKeys.push(key)
  })
  const toRowByKey = new Map<string, {row: MaybeRow; index: number}>()
  const toRowKeys: string[] = []
  toRows.forEach((row, index) => {
    const key = keyOf(row, `@${index}`)
    toRowByKey.set(key, {row, index})
    toRowKeys.push(key)
  })
  const movedRowKeys = movedKeys(fromRowKeys, toRowKeys)

  // Current (to) rows first, in order; removed rows appended afterwards.
  const orderedKeys: string[] = []
  const seen = new Set<string>()
  const pushKey = (key: string) => {
    if (!seen.has(key)) {
      seen.add(key)
      orderedKeys.push(key)
    }
  }
  toRowKeys.forEach(pushKey)
  fromRowKeys.forEach(pushKey)

  const descriptors = buildColumnDescriptors(from, to, fromRows, toRows)
  const fromColKeys = descriptors
    .filter((d) => d.fromIndex !== null)
    .sort((a, b) => (a.fromIndex ?? 0) - (b.fromIndex ?? 0))
    .map((d) => d.key)
  const toColKeys = descriptors
    .filter((d) => d.toIndex !== null)
    .sort((a, b) => (a.toIndex ?? 0) - (b.toIndex ?? 0))
    .map((d) => d.key)
  const movedColKeys = movedKeys(fromColKeys, toColKeys)

  let columnsAdded = 0
  let columnsRemoved = 0
  let columnsMoved = 0
  let columnTitleChanges = 0

  const columns: TableDiffColumnModel[] = descriptors.map((descriptor) => {
    const hasFrom = descriptor.fromIndex !== null
    const hasTo = descriptor.toIndex !== null
    const status = structuralStatus(hasFrom, hasTo, movedColKeys.has(descriptor.key))
    const titleChanged = hasFrom && hasTo && descriptor.fromTitle !== descriptor.toTitle
    if (status === 'added') columnsAdded++
    else if (status === 'removed') columnsRemoved++
    else if (status === 'moved') columnsMoved++
    if (titleChanged) columnTitleChanges++
    return {
      index: descriptor.toIndex ?? descriptor.fromIndex ?? 0,
      status,
      titleChanged,
      fromTitle: descriptor.fromTitle,
      toTitle: descriptor.toTitle,
    }
  })

  let rowsAdded = 0
  let rowsRemoved = 0
  let rowsMoved = 0
  let rowTitleChanges = 0
  let cellsChanged = 0

  const rows: TableDiffRowModel[] = orderedKeys.map((key) => {
    const fromEntry = fromRowByKey.get(key)
    const toEntry = toRowByKey.get(key)
    const hasFrom = Boolean(fromEntry)
    const hasTo = Boolean(toEntry)
    const status = structuralStatus(hasFrom, hasTo, movedRowKeys.has(key))

    const fromTitle = asString(fromEntry?.row?.title)
    const toTitle = asString(toEntry?.row?.title)
    const titleChanged = hasFrom && hasTo && fromTitle !== toTitle

    const {cells, changed} = buildRowCells(
      status,
      asArray<MaybeCell>(fromEntry?.row?.cells),
      asArray<MaybeCell>(toEntry?.row?.cells),
      descriptors,
      key,
    )

    if (status === 'added') rowsAdded++
    else if (status === 'removed') rowsRemoved++
    else if (status === 'moved') rowsMoved++
    if (titleChanged) rowTitleChanges++
    cellsChanged += changed

    return {
      key,
      index: toEntry?.index ?? fromEntry?.index ?? 0,
      status,
      titleChanged,
      fromTitle,
      toTitle,
      cells,
    }
  })

  const bothPresent = Boolean(from) && Boolean(to)
  const fromHasColumnTitles = asBool(from?.hasColumnTitles, true)
  const toHasColumnTitles = asBool(to?.hasColumnTitles, true)
  const fromHasRowTitles = asBool(from?.hasRowTitles, true)
  const toHasRowTitles = asBool(to?.hasRowTitles, true)
  const columnTitlesToggled = bothPresent && fromHasColumnTitles !== toHasColumnTitles
  const rowTitlesToggled = bothPresent && fromHasRowTitles !== toHasRowTitles

  const hasChanges =
    columnsAdded > 0 ||
    columnsRemoved > 0 ||
    columnsMoved > 0 ||
    rowsAdded > 0 ||
    rowsRemoved > 0 ||
    rowsMoved > 0 ||
    cellsChanged > 0 ||
    columnTitleChanges > 0 ||
    rowTitleChanges > 0 ||
    columnTitlesToggled ||
    rowTitlesToggled

  return {
    rows,
    columns,
    hasColumnTitles: to ? toHasColumnTitles : fromHasColumnTitles,
    hasRowTitles: to ? toHasRowTitles : fromHasRowTitles,
    columnTitlesToggled,
    rowTitlesToggled,
    hasChanges,
    summary: {
      columnsAdded,
      columnsRemoved,
      columnsMoved,
      rowsAdded,
      rowsRemoved,
      rowsMoved,
      cellsChanged,
    },
  }
}
