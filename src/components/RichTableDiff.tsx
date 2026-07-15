import {Badge, Box, Card, type CardTone, Dialog, Flex, Stack, Text} from '@sanity/ui'
import {
  Component,
  type CSSProperties,
  type ErrorInfo,
  Fragment,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react'
import {type DiffProps} from 'sanity'
import {styled} from 'styled-components'

import type {RichTableType} from '../schemas/richTable.object'
import {
  buildTableDiffModel,
  type CellDiffStatus,
  type StructuralStatus,
  type TableDiffCellModel,
  type TableDiffColumnModel,
  type TableDiffModel,
  type TableDiffRowModel,
} from '../utils/buildTableDiffModel'
import {DIFF_ADDED_BG, DIFF_REMOVED_BG} from '../utils/diffColors'
import {getLetterBasedOnIndex} from '../utils/getLetterBasedOnIndex'
import {hasInlineChanges, inlineTextDiff} from '../utils/inlineTextDiff'

const CELL_TONE: Record<CellDiffStatus, CardTone> = {
  added: 'positive',
  removed: 'critical',
  changed: 'caution',
  unchanged: 'transparent',
}

const STRUCTURAL_TONE: Record<StructuralStatus, CardTone> = {
  added: 'positive',
  removed: 'critical',
  moved: 'primary',
  unchanged: 'transparent',
}

const CELL_STATUS_LABEL: Record<CellDiffStatus, string> = {
  added: 'Added',
  removed: 'Removed',
  changed: 'Changed',
  unchanged: 'Unchanged',
}

// Badge tone can't be 'transparent' (only Card can), so map cell status separately.
const CELL_BADGE_TONE: Record<CellDiffStatus, 'default' | 'positive' | 'caution' | 'critical'> = {
  added: 'positive',
  removed: 'critical',
  changed: 'caution',
  unchanged: 'default',
}

/**
 * Grid track list for the diff table: a fixed row-label column plus one track per
 * data column. Guards against `repeat(0, …)`, which is invalid CSS and would cause
 * the browser to drop the whole `grid-template-columns` declaration.
 */
export function columnsTrackList(columns: number): string {
  const rowLabelTrack = 'minmax(64px, auto)'
  return columns > 0 ? `${rowLabelTrack} repeat(${columns}, minmax(96px, 1fr))` : rowLabelTrack
}

const Grid = styled.div<{$columns: number}>`
  display: grid;
  grid-template-columns: ${(props) => columnsTrackList(props.$columns)};
  gap: 1px;
  overflow-x: auto;
`

const Struck = styled(Text)`
  text-decoration: line-through;
`

// Inline diff spans, echoing Sanity's positive/critical diff tones. Semi-transparent
// so they tint whatever card background they sit on and stay legible in light and dark.
const AddedText = styled.span`
  background-color: ${DIFF_ADDED_BG};
  border-radius: 2px;
`
const RemovedText = styled.span`
  background-color: ${DIFF_REMOVED_BG};
  text-decoration: line-through;
  border-radius: 2px;
`

const PRE_WRAP: CSSProperties = {whiteSpace: 'pre-wrap', wordBreak: 'break-word'}
const CLICKABLE: CSSProperties = {cursor: 'pointer'}

/** A cell selected for detailed inspection. */
interface SelectedCell {
  cell: TableDiffCellModel
  columnLabel: string
  rowLabel: string
}

/**
 * Catches any unexpected error while rendering the table diff and falls back to
 * a small, safe message instead of letting the whole "Review changes" pane fail.
 */
class RichTableDiffBoundary extends Component<{children: ReactNode}, {hasError: boolean}> {
  state = {hasError: false}

  static getDerivedStateFromError() {
    return {hasError: true}
  }

  // eslint-disable-next-line class-methods-use-this
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Failed to render rich table diff:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card tone="caution" padding={3} radius={2} border>
          <Text size={1}>The rich table changed. Open the document to see the full changes.</Text>
        </Card>
      )
    }
    return this.props.children
  }
}

function columnLabelOf(column: TableDiffColumnModel, hasColumnTitles: boolean): string {
  const letter = getLetterBasedOnIndex(column.index)
  if (!hasColumnTitles) return letter
  if (column.status === 'removed') return column.fromTitle || letter
  return column.toTitle || letter
}

function rowLabelOf(row: TableDiffRowModel, hasRowTitles: boolean): string {
  const number = String(row.index + 1)
  if (!hasRowTitles) return number
  if (row.status === 'removed') return row.fromTitle || number
  return row.toTitle || number
}

function safeJson(value: unknown): string {
  if (value === undefined) return '(none)'
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

/** A header cell (column or row label) with the previous label struck through when it changed. */
function LabelCell({
  tone,
  current,
  previous,
  moved,
}: {
  tone: CardTone
  current: string
  previous?: string
  moved?: boolean
}) {
  return (
    <Card tone={tone} padding={2} radius={1} border>
      <Stack space={1}>
        {previous !== undefined && previous !== current ? (
          <Struck size={0} muted>
            {previous}
          </Struck>
        ) : null}
        <Flex align="center" gap={2}>
          <Text size={1} weight="semibold" muted={tone === 'transparent'}>
            {current}
          </Text>
          {moved ? (
            <Badge tone="primary" fontSize={0}>
              moved
            </Badge>
          ) : null}
        </Flex>
      </Stack>
    </Card>
  )
}

function ColumnHeaderCell({
  column,
  hasColumnTitles,
}: {
  column: TableDiffColumnModel
  hasColumnTitles: boolean
}) {
  const letter = getLetterBasedOnIndex(column.index)
  const moved = column.status === 'moved'
  let tone: CardTone =
    column.status === 'unchanged' ? 'transparent' : STRUCTURAL_TONE[column.status]
  let current = letter
  let previous: string | undefined

  if (hasColumnTitles) {
    if (column.status === 'removed') {
      current = column.fromTitle || letter
    } else {
      current = column.toTitle || letter
      if (column.titleChanged) {
        previous = column.fromTitle || letter
        if (tone === 'transparent') tone = 'caution'
      }
    }
  }

  return <LabelCell tone={tone} current={current} previous={previous} moved={moved} />
}

function RowHeaderCell({row, hasRowTitles}: {row: TableDiffRowModel; hasRowTitles: boolean}) {
  const number = String(row.index + 1)
  const moved = row.status === 'moved'
  let tone: CardTone = row.status === 'unchanged' ? 'transparent' : STRUCTURAL_TONE[row.status]
  let current = number
  let previous: string | undefined

  if (hasRowTitles) {
    if (row.status === 'removed') {
      current = row.fromTitle || number
    } else {
      current = row.toTitle || number
      if (row.titleChanged) {
        previous = row.fromTitle || number
        if (tone === 'transparent') tone = 'caution'
      }
    }
  }

  return <LabelCell tone={tone} current={current} previous={previous} moved={moved} />
}

/** Cell body. Empty cells render blank (no placeholder); changed cells show old (struck) then new. */
function CellBody({
  status,
  fromText,
  toText,
}: {
  status: CellDiffStatus
  fromText: string
  toText: string
}) {
  if (status === 'removed') {
    return fromText ? (
      <Struck size={1} muted textOverflow="ellipsis">
        {fromText}
      </Struck>
    ) : null
  }

  return (
    <Stack space={2}>
      {status === 'changed' && fromText ? (
        <Struck size={1} muted textOverflow="ellipsis">
          {fromText}
        </Struck>
      ) : null}
      {toText ? (
        <Text size={1} textOverflow="ellipsis">
          {toText}
        </Text>
      ) : null}
    </Stack>
  )
}

/** A clickable body cell that opens the detail inspector when activated. */
function InspectableCell({
  cell,
  columnLabel,
  rowLabel,
  onSelect,
}: {
  cell: TableDiffCellModel
  columnLabel: string
  rowLabel: string
  onSelect: (selected: SelectedCell) => void
}) {
  const handleSelect = useCallback(
    () => onSelect({cell, columnLabel, rowLabel}),
    [cell, columnLabel, rowLabel, onSelect],
  )
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onSelect({cell, columnLabel, rowLabel})
      }
    },
    [cell, columnLabel, rowLabel, onSelect],
  )

  return (
    <Card
      tone={CELL_TONE[cell.status]}
      padding={2}
      radius={1}
      border
      role="button"
      tabIndex={0}
      aria-label={`Inspect cell column ${columnLabel}, row ${rowLabel}, ${CELL_STATUS_LABEL[
        cell.status
      ].toLowerCase()}`}
      style={CLICKABLE}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
    >
      <CellBody status={cell.status} fromText={cell.fromText} toText={cell.toText} />
    </Card>
  )
}

/** Collapsible raw Portable Text for a single revision — the escape hatch for
 * anything the lossy plain-text view drops (marks, image refs, nested objects). */
function RawContent({label, content}: {label: string; content: unknown}) {
  return (
    <details>
      <summary style={CLICKABLE}>
        <Text as="span" size={0} muted>
          {label}
        </Text>
      </summary>
      <Card tone="transparent" padding={2} radius={1} marginTop={2}>
        <Text as="pre" size={0} muted style={{...PRE_WRAP, fontFamily: 'monospace'}}>
          {safeJson(content)}
        </Text>
      </Card>
    </details>
  )
}

/** One before/after section inside the detail dialog: readable text + collapsible raw content. */
function DetailSection({
  label,
  tone,
  text,
  content,
}: {
  label: string
  tone: CardTone
  text: string
  content: unknown
}) {
  return (
    <Stack space={2}>
      <Text size={1} weight="semibold" muted>
        {label}
      </Text>
      <Card tone={tone} padding={3} radius={2} border>
        {text ? (
          <Text size={1} style={PRE_WRAP}>
            {text}
          </Text>
        ) : (
          <Text size={1} muted>
            (empty)
          </Text>
        )}
      </Card>
      <RawContent label="Raw content" content={content} />
    </Stack>
  )
}

/** The old and new text merged into one view: removed text struck through, added
 * text highlighted, unchanged text plain. Falls back to the plain "after" text
 * when the word diff finds nothing to highlight (e.g. only formatting changed). */
function InlineDiffText({from, to}: {from: string; to: string}) {
  const segments = useMemo(() => inlineTextDiff(from, to), [from, to])

  if (!hasInlineChanges(segments)) {
    const text = to || from
    return text ? (
      <Text size={1} style={PRE_WRAP}>
        {text}
      </Text>
    ) : (
      <Text size={1} muted>
        (empty)
      </Text>
    )
  }

  return (
    <Text size={1} style={PRE_WRAP}>
      {segments.map((segment, index) => {
        const key = `${segment.status}-${index}`
        if (segment.status === 'added') return <AddedText key={key}>{segment.value}</AddedText>
        if (segment.status === 'removed')
          return <RemovedText key={key}>{segment.value}</RemovedText>
        return <Fragment key={key}>{segment.value}</Fragment>
      })}
    </Text>
  )
}

/** The combined before→after view for a changed cell: one inline diff instead of
 * two separate snapshots, with each revision's raw content still available. */
function CombinedChangesSection({cell}: {cell: TableDiffCellModel}) {
  return (
    <Stack space={2}>
      <Text size={1} weight="semibold" muted>
        Changes
      </Text>
      <Card tone="transparent" padding={3} radius={2} border>
        <InlineDiffText from={cell.fromText} to={cell.toText} />
      </Card>
      <RawContent label="Raw content (before)" content={cell.fromContent} />
      <RawContent label="Raw content (after)" content={cell.toContent} />
    </Stack>
  )
}

function CellDetailDialog({selected, onClose}: {selected: SelectedCell; onClose: () => void}) {
  const {cell, columnLabel, rowLabel} = selected
  // A changed cell shows one combined inline diff; added/removed show the single
  // relevant snapshot; unchanged shows the current content.
  const showBefore = cell.status === 'removed'
  const showAfter = cell.status === 'added'
  const showCombined = cell.status === 'changed'
  const showCurrent = cell.status === 'unchanged'

  return (
    <Dialog
      id="rich-table-cell-detail"
      header={`Cell — column ${columnLabel}, row ${rowLabel}`}
      onClose={onClose}
      onClickOutside={onClose}
      width={1}
    >
      <Box padding={4}>
        <Stack space={4}>
          <Flex>
            <Badge tone={CELL_BADGE_TONE[cell.status]} fontSize={1}>
              {CELL_STATUS_LABEL[cell.status]}
            </Badge>
          </Flex>
          {showCombined ? <CombinedChangesSection cell={cell} /> : null}
          {showBefore ? (
            <DetailSection
              label="Before"
              tone="critical"
              text={cell.fromText}
              content={cell.fromContent}
            />
          ) : null}
          {showAfter ? (
            <DetailSection
              label="After"
              tone="positive"
              text={cell.toText}
              content={cell.toContent}
            />
          ) : null}
          {showCurrent ? (
            <DetailSection
              label="Content"
              tone="transparent"
              text={cell.toText}
              content={cell.toContent}
            />
          ) : null}
        </Stack>
      </Box>
    </Dialog>
  )
}

function SummaryBadges({model}: {model: TableDiffModel}) {
  const {summary, columnTitlesToggled, rowTitlesToggled, hasColumnTitles, hasRowTitles} = model
  const unit = (count: number, singular: string) =>
    `${count} ${count === 1 ? singular : `${singular}s`}`
  const badges: ReactNode[] = []

  if (summary.columnsAdded > 0)
    badges.push(
      <Badge key="col-add" tone="positive" fontSize={0}>
        +{unit(summary.columnsAdded, 'column')}
      </Badge>,
    )
  if (summary.columnsRemoved > 0)
    badges.push(
      <Badge key="col-remove" tone="critical" fontSize={0}>
        −{unit(summary.columnsRemoved, 'column')}
      </Badge>,
    )
  if (summary.columnsMoved > 0)
    badges.push(
      <Badge key="col-move" tone="primary" fontSize={0}>
        {unit(summary.columnsMoved, 'column')} moved
      </Badge>,
    )
  if (summary.rowsAdded > 0)
    badges.push(
      <Badge key="row-add" tone="positive" fontSize={0}>
        +{unit(summary.rowsAdded, 'row')}
      </Badge>,
    )
  if (summary.rowsRemoved > 0)
    badges.push(
      <Badge key="row-remove" tone="critical" fontSize={0}>
        −{unit(summary.rowsRemoved, 'row')}
      </Badge>,
    )
  if (summary.rowsMoved > 0)
    badges.push(
      <Badge key="row-move" tone="primary" fontSize={0}>
        {unit(summary.rowsMoved, 'row')} moved
      </Badge>,
    )
  if (summary.cellsChanged > 0)
    badges.push(
      <Badge key="cells" tone="caution" fontSize={0}>
        {unit(summary.cellsChanged, 'cell')} changed
      </Badge>,
    )
  if (columnTitlesToggled)
    badges.push(
      <Badge key="col-titles" fontSize={0}>
        Column titles {hasColumnTitles ? 'shown' : 'hidden'}
      </Badge>,
    )
  if (rowTitlesToggled)
    badges.push(
      <Badge key="row-titles" fontSize={0}>
        Row titles {hasRowTitles ? 'shown' : 'hidden'}
      </Badge>,
    )

  if (badges.length === 0) return null

  return (
    <Flex gap={2} wrap="wrap">
      {badges}
    </Flex>
  )
}

function RichTableDiffContent({diff}: DiffProps) {
  const [selected, setSelected] = useState<SelectedCell | null>(null)
  const closeDetail = useCallback(() => setSelected(null), [])

  // Memoize the (O(n·m) LCS) diff computation so it doesn't re-run when only the
  // cell-inspector `selected` state toggles — the diff values are stable references.
  const model = useMemo(
    () =>
      buildTableDiffModel(
        diff.fromValue as RichTableType | undefined,
        diff.toValue as RichTableType | undefined,
      ),
    [diff.fromValue, diff.toValue],
  )

  if (!model.hasChanges) {
    return (
      <Text size={1} muted>
        No visible changes to the table.
      </Text>
    )
  }

  if (model.rows.length === 0 && model.columns.length === 0) {
    return (
      <Stack space={3}>
        <SummaryBadges model={model} />
        <Text size={1} muted>
          The table is empty.
        </Text>
      </Stack>
    )
  }

  const columnLabels = model.columns.map((column) => columnLabelOf(column, model.hasColumnTitles))

  return (
    <Stack space={3}>
      <SummaryBadges model={model} />

      <Card border radius={2} overflow="hidden" tone="transparent">
        <Grid $columns={model.columns.length}>
          {/* Header row: empty corner + column labels (A, B, C… or titles) */}
          <Card padding={2} tone="transparent" />
          {model.columns.map((column) => (
            <ColumnHeaderCell
              key={`col-${column.index}-${column.status}`}
              column={column}
              hasColumnTitles={model.hasColumnTitles}
            />
          ))}

          {/* Body rows: row label (1, 2, 3… or title) + clickable cells */}
          {model.rows.map((row) => {
            const rowLabel = rowLabelOf(row, model.hasRowTitles)
            return (
              <Fragment key={row.key}>
                <RowHeaderCell row={row} hasRowTitles={model.hasRowTitles} />
                {row.cells.map((cell, columnIndex) => (
                  <InspectableCell
                    key={cell.key}
                    cell={cell}
                    columnLabel={columnLabels[columnIndex]}
                    rowLabel={rowLabel}
                    onSelect={setSelected}
                  />
                ))}
              </Fragment>
            )
          })}
        </Grid>
      </Card>

      {selected ? <CellDetailDialog selected={selected} onClose={closeDetail} /> : null}
    </Stack>
  )
}

/**
 * Custom diff component for the `richTable` type. Renders a readable before/after
 * grid in the Studio "Review changes" pane instead of relying on the generic
 * field-by-field differ, which struggles with (and can fail to render) the
 * deeply nested rows → cells → Portable Text structure. Cells are clickable to
 * inspect their full before/after content (including raw Portable Text).
 */
export default function RichTableDiff(props: DiffProps): ReactNode {
  return (
    <RichTableDiffBoundary>
      <RichTableDiffContent {...props} />
    </RichTableDiffBoundary>
  )
}
