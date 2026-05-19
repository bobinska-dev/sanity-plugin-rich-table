import React, {useCallback, useEffect, useState} from 'react'

interface UseCellNavigationOptions {
  totalRows: number
  totalCols: number
  readOnly?: boolean
}

interface UseCellNavigationReturn {
  /** Currently selected cell key (e.g., "0-2") */
  selectedCellKey: string | null
  /** Currently editing cell key */
  editingCellKey: string | null
  /** Set the selected cell */
  setSelectedCellKey: (key: string | null) => void
  /** Set the editing cell */
  setEditingCellKey: (key: string | null) => void
  /** Create cell key from row/col indices */
  makeCellKey: (row: number, col: number) => string
  /** Parse cell key to row/col indices */
  parseCellKey: (key: string | null) => {row: number; col: number} | null
  /** Keyboard handler - attach to onKeyDown on cell elements */
  handleKeyDown: (e: React.KeyboardEvent) => void
  /** Get accessible label for cell (e.g., "Cell A1") */
  getCellLabel: (rowIndex: number, cellIndex: number) => string
}

// Get column label (A, B, C... AA, AB, etc.)
const getColumnLabel = (index: number): string => {
  let label = ''
  let i = index
  do {
    label = String.fromCharCode(65 + (i % 26)) + label
    i = Math.floor(i / 26) - 1
  } while (i >= 0)
  return label
}

/**
 * Hook for managing cell selection and keyboard navigation within a table.
 *
 * Supports:
 * - Arrow key navigation between cells
 * - Tab to move to next cell (wraps to next row)
 * - Enter to start editing selected cell
 * - Escape to close edit mode or deselect
 *
 * @example
 * const { selectedCellKey, editingCellKey, handleKeyDown, ... } = useCellNavigation({
 *   totalRows: 5,
 *   totalCols: 3,
 * })
 */
export function useCellNavigation({
  totalRows,
  totalCols,
  readOnly = false,
}: UseCellNavigationOptions): UseCellNavigationReturn {
  const [editingCellKey, setEditingCellKey] = useState<string | null>(null)
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null)

  // Parse cell key to get row and cell indices
  const parseCellKey = useCallback((key: string | null): {row: number; col: number} | null => {
    if (!key) return null
    const [row, col] = key.split('-').map(Number)
    return {row, col}
  }, [])

  // Create cell key from indices
  const makeCellKey = useCallback((row: number, col: number): string => `${row}-${col}`, [])

  // Get cell label (e.g., "Cell A1")
  const getCellLabel = useCallback((rowIndex: number, cellIndex: number): string => {
    return `Cell ${getColumnLabel(cellIndex)}${rowIndex + 1}`
  }, [])

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (readOnly) return

      // Escape: close editing or deselect
      if (e.key === 'Escape') {
        e.stopPropagation() // Prevent bubbling to parent (Sanity form navigation)
        e.preventDefault()
        if (editingCellKey) {
          setEditingCellKey(null)
        } else if (selectedCellKey) {
          setSelectedCellKey(null)
        }
        return
      }

      // Don't intercept keyboard when editing - let inputs handle their own events
      if (editingCellKey) return

      // Only handle navigation when the cell is selected
      // e.currentTarget is the cell card (where onKeyDown is attached)
      // e.target may be a child element but we still want navigation to work
      const cellCard = e.currentTarget as HTMLElement

      // If event comes from inside the cell (currentTarget contains target), allow navigation
      // This supports cells within dialogs where focus may be on inner elements
      if (!cellCard.contains(e.target as HTMLElement)) return

      const current = parseCellKey(selectedCellKey)
      if (!current) return

      let newRow = current.row
      let newCol = current.col

      // Arrow key navigation
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        e.stopPropagation() // Prevent Dialog from intercepting
        newCol = Math.max(0, current.col - 1)
      } else if (e.key === 'ArrowRight' || e.key === 'Tab') {
        e.preventDefault()
        e.stopPropagation() // Prevent Dialog from intercepting
        if (current.col < totalCols - 1) {
          newCol = current.col + 1
        } else if (e.key === 'Tab' && current.row < totalRows - 1) {
          // Tab wraps to next row
          newRow = current.row + 1
          newCol = 0
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation() // Prevent Dialog from intercepting
        newRow = Math.max(0, current.row - 1)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation() // Prevent Dialog from intercepting
        newRow = Math.min(totalRows - 1, current.row + 1)
      } else if (e.key === 'Enter') {
        // Enter to start editing
        e.preventDefault()
        setEditingCellKey(selectedCellKey)
        return
      } else {
        return
      }

      if (newRow !== current.row || newCol !== current.col) {
        setSelectedCellKey(makeCellKey(newRow, newCol))
      }
    },
    [editingCellKey, selectedCellKey, parseCellKey, makeCellKey, totalRows, totalCols, readOnly],
  )

  // Focus the selected cell when it changes (for keyboard navigation)
  useEffect(() => {
    if (selectedCellKey && !editingCellKey) {
      const cell = document.querySelector(`[data-cell-key="${selectedCellKey}"]`) as HTMLElement
      cell?.focus()
    }
  }, [selectedCellKey, editingCellKey])

  return {
    selectedCellKey,
    editingCellKey,
    setSelectedCellKey,
    setEditingCellKey,
    makeCellKey,
    parseCellKey,
    handleKeyDown,
    getCellLabel,
  }
}
