import {Box, Text, Tooltip} from '@sanity/ui'
import {
  ComponentType,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useRef,
} from 'react'
import {styled} from 'styled-components'

// Smallest width (px) a column can be dragged to, so it can't collapse to
// nothing and lose its handle.
const MIN_COLUMN_WIDTH = 48
// Nudge per arrow-key press, for keyboard-driven resizing.
const KEYBOARD_STEP = 16

// A persistent divider marks the draggable column boundary so the affordance is
// discoverable. Its guide line is pinned to the cell's right edge so it lines up
// with the cell separators below, and thickens to the focus-ring colour on hover
// / focus and while the resize is active — the dragged column, or every column
// during a Shift-drag (see the `active` prop), so "resize all" is visible.
const Handle = styled.button`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 8px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: col-resize;
  touch-action: none;
  appearance: none;
  z-index: 1;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    width: 2px;
    background: var(--card-border-color);
    opacity: 0.75;
    transition:
      opacity 100ms,
      width 100ms,
      background 100ms;
  }

  &:hover::after,
  &:focus::after,
  &[data-active='true']::after {
    width: 4px;
    opacity: 1;
    background: var(--card-focus-ring-color);
  }
`

interface ColumnResizeHandleProps {
  columnKey: string
  /** Accessible name for the handle, e.g. "Resize column 2". */
  label: string
  /** Whether holding Shift resizes every column (content columns); `false` for
   * the row-title column, which resizes on its own. Drives the messaging. */
  allowResizeAll?: boolean
  /** True while this column is part of the active resize — its own drag, or any
   * column during a Shift-drag — so its divider stays highlighted. */
  active?: boolean
  /** Live width during the drag (optimistic, not yet persisted). */
  onResize: (columnKey: string, width: number, applyToAll: boolean) => void
  /** Final width on pointer release / key press (persisted via patch). */
  onResizeEnd: (columnKey: string, width: number, applyToAll: boolean) => void
}

// The header cell (`data-rt-column-cell`) is the track we measure and resize.
const measureCell = (handle: HTMLButtonElement) =>
  handle.closest<HTMLElement>('[data-rt-column-cell]')

/**
 * A drag handle rendered in the right edge of a column header. Dragging resizes
 * the column; holding Shift (live — press or release mid-drag) resizes every
 * column to the same width. Widths are measured from the live cell so an unsized
 * (`1fr`) column resizes from its rendered width. Arrow keys nudge the width for
 * keyboard users.
 */
export const ColumnResizeHandle: ComponentType<ColumnResizeHandleProps> = ({
  columnKey,
  label,
  allowResizeAll = true,
  active,
  onResize,
  onResizeEnd,
}) => {
  // Drag bookkeeping lives in a ref so the move/up handlers stay stable and a
  // pointer move doesn't re-render the whole table on every pixel.
  const drag = useRef<{startX: number; startWidth: number; width: number; moved: boolean} | null>(
    null,
  )

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const cell = measureCell(event.currentTarget)
    if (!cell) return
    // Stop text selection during the drag; but preventDefault also cancels the
    // button's default focus, so focus it explicitly — otherwise arrow-key
    // resizing never works because a click can't focus the handle.
    event.preventDefault()
    event.currentTarget.focus()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      startX: event.clientX,
      startWidth: cell.offsetWidth,
      width: cell.offsetWidth,
      moved: false,
    }
  }, [])

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const current = drag.current
      if (!current) return
      const width = Math.max(
        MIN_COLUMN_WIDTH,
        current.startWidth + (event.clientX - current.startX),
      )
      current.width = width
      current.moved = true
      onResize(columnKey, width, event.shiftKey)
    },
    [columnKey, onResize],
  )

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const current = drag.current
      if (!current) return
      event.currentTarget.releasePointerCapture(event.pointerId)
      drag.current = null
      // A plain click (to focus the handle for keyboard use) isn't a resize, so
      // don't freeze an auto-width column at its current px.
      if (current.moved) onResizeEnd(columnKey, current.width, event.shiftKey)
    },
    [columnKey, onResizeEnd],
  )

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      let step = 0
      if (event.key === 'ArrowLeft') step = -KEYBOARD_STEP
      if (event.key === 'ArrowRight') step = KEYBOARD_STEP
      const cell = measureCell(event.currentTarget)
      if (!step || !cell) return
      event.preventDefault()
      const width = Math.max(MIN_COLUMN_WIDTH, cell.offsetWidth + step)
      onResize(columnKey, width, event.shiftKey)
      onResizeEnd(columnKey, width, event.shiftKey)
    },
    [columnKey, onResize, onResizeEnd],
  )

  return (
    <Tooltip
      content={
        <Box padding={2}>
          <Text size={1}>
            {allowResizeAll
              ? 'Drag to resize. Hold Shift to resize all columns.'
              : 'Drag to resize.'}
          </Text>
        </Box>
      }
      portal
    >
      <Handle
        type="button"
        data-active={active ? 'true' : undefined}
        aria-label={allowResizeAll ? `${label} (hold Shift to resize all columns)` : label}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        // Don't let the drag reach the card's double-click-to-open handler in Portable Text.
        onDoubleClick={(event) => event.stopPropagation()}
      />
    </Tooltip>
  )
}

export default ColumnResizeHandle
