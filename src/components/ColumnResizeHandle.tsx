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

// The handle sits in the header cell's right-hand gutter (see `ColumnHeaderCell`)
// so it never overlaps the column context-menu button. A thin guide line is
// centered in the grab area and brightens on hover / focus / drag.
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
    top: 15%;
    bottom: 15%;
    left: 50%;
    width: 2px;
    transform: translateX(-50%);
    border-radius: 2px;
    background: var(--card-border-color);
    opacity: 0;
    transition: opacity 100ms;
  }

  &:hover::after,
  &:focus-visible::after,
  &[data-dragging='true']::after {
    opacity: 1;
    background: var(--card-focus-ring-color);
  }
`

interface ColumnResizeHandleProps {
  columnKey: string
  columnIndex: number
  /** Live width during the drag (optimistic, not yet persisted). */
  onResize: (columnKey: string, width: number, applyToAll: boolean) => void
  /** Final width on pointer release / key press (persisted via patch). */
  onResizeEnd: (columnKey: string, width: number, applyToAll: boolean) => void
}

/**
 * A drag handle rendered in the right edge of a column header. Dragging resizes
 * the column; holding Shift resizes every column to the same width. Widths are
 * measured from the live cell so an unsized (`1fr`) column resizes from its
 * rendered width. Arrow keys nudge the width for keyboard users.
 */
export const ColumnResizeHandle: ComponentType<ColumnResizeHandleProps> = ({
  columnKey,
  columnIndex,
  onResize,
  onResizeEnd,
}) => {
  // Drag bookkeeping lives in a ref so the move/up handlers stay stable and a
  // pointer move doesn't re-render the whole table on every pixel.
  const drag = useRef<{
    startX: number
    startWidth: number
    width: number
    applyToAll: boolean
  } | null>(null)

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    // The header cell is the handle's offset parent (position: relative).
    const cell = event.currentTarget.parentElement
    if (!cell) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.dataset.dragging = 'true'
    drag.current = {
      startX: event.clientX,
      startWidth: cell.offsetWidth,
      width: cell.offsetWidth,
      applyToAll: event.shiftKey,
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
      onResize(columnKey, width, current.applyToAll)
    },
    [columnKey, onResize],
  )

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const current = drag.current
      if (!current) return
      event.currentTarget.releasePointerCapture(event.pointerId)
      event.currentTarget.dataset.dragging = 'false'
      drag.current = null
      onResizeEnd(columnKey, current.width, current.applyToAll)
    },
    [columnKey, onResizeEnd],
  )

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      let step = 0
      if (event.key === 'ArrowLeft') step = -KEYBOARD_STEP
      if (event.key === 'ArrowRight') step = KEYBOARD_STEP
      const cell = event.currentTarget.parentElement
      if (!step || !cell) return
      event.preventDefault()
      const width = Math.max(MIN_COLUMN_WIDTH, cell.offsetWidth + step)
      onResize(columnKey, width, event.shiftKey)
      onResizeEnd(columnKey, width, event.shiftKey)
    },
    [columnKey, onResize, onResizeEnd],
  )

  return (
    <Handle
      type="button"
      aria-label={`Resize column ${columnIndex + 1} (hold Shift to resize all columns)`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      // Don't let the drag reach the card's double-click-to-open handler in Portable Text.
      onDoubleClick={(event) => event.stopPropagation()}
    />
  )
}

export default ColumnResizeHandle
