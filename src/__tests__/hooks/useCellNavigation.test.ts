import {act, renderHook} from '@testing-library/react'
import type {KeyboardEvent} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {useCellNavigation} from '../../hooks/useCellNavigation'

function createKeyboardEvent(
  key: string,
  options: {target?: HTMLElement; currentTarget?: HTMLElement} = {},
): KeyboardEvent<HTMLElement> {
  const element = document.createElement('div')
  return {
    key,
    target: options.target ?? element,
    currentTarget: options.currentTarget ?? element,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as KeyboardEvent<HTMLElement>
}

describe('useCellNavigation', () => {
  describe('initial state', () => {
    it('returns null for selectedCellKey and editingCellKey initially', () => {
      const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

      expect(result.current.selectedCellKey).toBeNull()
      expect(result.current.editingCellKey).toBeNull()
    })

    it('returns helper functions', () => {
      const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

      expect(typeof result.current.makeCellKey).toBe('function')
      expect(typeof result.current.parseCellKey).toBe('function')
      expect(typeof result.current.getCellLabel).toBe('function')
      expect(typeof result.current.handleKeyDown).toBe('function')
      expect(typeof result.current.setSelectedCellKey).toBe('function')
      expect(typeof result.current.setEditingCellKey).toBe('function')
    })
  })

  describe('makeCellKey', () => {
    it('creates cell key from row and col indices', () => {
      const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

      expect(result.current.makeCellKey(0, 0)).toBe('0-0')
      expect(result.current.makeCellKey(2, 5)).toBe('2-5')
      expect(result.current.makeCellKey(10, 20)).toBe('10-20')
    })
  })

  describe('parseCellKey', () => {
    it('parses cell key to row and col indices', () => {
      const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

      expect(result.current.parseCellKey('0-0')).toEqual({row: 0, col: 0})
      expect(result.current.parseCellKey('2-5')).toEqual({row: 2, col: 5})
      expect(result.current.parseCellKey('10-20')).toEqual({row: 10, col: 20})
    })

    it('returns null for null input', () => {
      const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

      expect(result.current.parseCellKey(null)).toBeNull()
    })
  })

  describe('getCellLabel', () => {
    it('returns accessible label with column letter and row number', () => {
      const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

      expect(result.current.getCellLabel(0, 0)).toBe('Cell A1')
      expect(result.current.getCellLabel(0, 1)).toBe('Cell B1')
      expect(result.current.getCellLabel(1, 0)).toBe('Cell A2')
      expect(result.current.getCellLabel(2, 2)).toBe('Cell C3')
    })

    it('handles column indices beyond Z (AA, AB, etc.)', () => {
      const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 30}))

      expect(result.current.getCellLabel(0, 25)).toBe('Cell Z1') // 26th column (0-indexed 25)
      expect(result.current.getCellLabel(0, 26)).toBe('Cell AA1') // 27th column
      expect(result.current.getCellLabel(0, 27)).toBe('Cell AB1') // 28th column
    })
  })

  describe('setSelectedCellKey', () => {
    it('updates selectedCellKey', () => {
      const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

      act(() => {
        result.current.setSelectedCellKey('1-2')
      })

      expect(result.current.selectedCellKey).toBe('1-2')
    })

    it('can set to null', () => {
      const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

      act(() => {
        result.current.setSelectedCellKey('1-2')
      })
      act(() => {
        result.current.setSelectedCellKey(null)
      })

      expect(result.current.selectedCellKey).toBeNull()
    })
  })

  describe('setEditingCellKey', () => {
    it('updates editingCellKey', () => {
      const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

      act(() => {
        result.current.setEditingCellKey('1-2')
      })

      expect(result.current.editingCellKey).toBe('1-2')
    })
  })

  describe('handleKeyDown', () => {
    describe('when readOnly', () => {
      it('does nothing when readOnly is true', () => {
        const {result} = renderHook(() =>
          useCellNavigation({totalRows: 3, totalCols: 3, readOnly: true}),
        )

        act(() => {
          result.current.setSelectedCellKey('1-1')
        })

        const event = createKeyboardEvent('ArrowRight')
        act(() => {
          result.current.handleKeyDown(event)
        })

        expect(result.current.selectedCellKey).toBe('1-1')
        expect(event.preventDefault).not.toHaveBeenCalled()
      })
    })

    describe('Escape key', () => {
      it('closes editing mode when editing', () => {
        const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

        act(() => {
          result.current.setSelectedCellKey('1-1')
          result.current.setEditingCellKey('1-1')
        })

        const event = createKeyboardEvent('Escape')
        act(() => {
          result.current.handleKeyDown(event)
        })

        expect(result.current.editingCellKey).toBeNull()
        expect(result.current.selectedCellKey).toBe('1-1') // Selection preserved
        expect(event.stopPropagation).toHaveBeenCalled()
        expect(event.preventDefault).toHaveBeenCalled()
      })

      it('deselects cell when not editing', () => {
        const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

        act(() => {
          result.current.setSelectedCellKey('1-1')
        })

        const event = createKeyboardEvent('Escape')
        act(() => {
          result.current.handleKeyDown(event)
        })

        expect(result.current.selectedCellKey).toBeNull()
        expect(event.stopPropagation).toHaveBeenCalled()
      })
    })

    describe('arrow key navigation', () => {
      it('moves left on ArrowLeft', () => {
        const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

        act(() => {
          result.current.setSelectedCellKey('1-2')
        })

        const event = createKeyboardEvent('ArrowLeft')
        act(() => {
          result.current.handleKeyDown(event)
        })

        expect(result.current.selectedCellKey).toBe('1-1')
        expect(event.preventDefault).toHaveBeenCalled()
      })

      it('does not go past first column on ArrowLeft', () => {
        const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

        act(() => {
          result.current.setSelectedCellKey('1-0')
        })

        const event = createKeyboardEvent('ArrowLeft')
        act(() => {
          result.current.handleKeyDown(event)
        })

        expect(result.current.selectedCellKey).toBe('1-0')
      })

      it('moves right on ArrowRight', () => {
        const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

        act(() => {
          result.current.setSelectedCellKey('1-0')
        })

        const event = createKeyboardEvent('ArrowRight')
        act(() => {
          result.current.handleKeyDown(event)
        })

        expect(result.current.selectedCellKey).toBe('1-1')
        expect(event.preventDefault).toHaveBeenCalled()
      })

      it('does not go past last column on ArrowRight', () => {
        const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

        act(() => {
          result.current.setSelectedCellKey('1-2')
        })

        const event = createKeyboardEvent('ArrowRight')
        act(() => {
          result.current.handleKeyDown(event)
        })

        expect(result.current.selectedCellKey).toBe('1-2')
      })

      it('moves up on ArrowUp', () => {
        const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

        act(() => {
          result.current.setSelectedCellKey('2-1')
        })

        const event = createKeyboardEvent('ArrowUp')
        act(() => {
          result.current.handleKeyDown(event)
        })

        expect(result.current.selectedCellKey).toBe('1-1')
        expect(event.preventDefault).toHaveBeenCalled()
      })

      it('does not go past first row on ArrowUp', () => {
        const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

        act(() => {
          result.current.setSelectedCellKey('0-1')
        })

        const event = createKeyboardEvent('ArrowUp')
        act(() => {
          result.current.handleKeyDown(event)
        })

        expect(result.current.selectedCellKey).toBe('0-1')
      })

      it('moves down on ArrowDown', () => {
        const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

        act(() => {
          result.current.setSelectedCellKey('0-1')
        })

        const event = createKeyboardEvent('ArrowDown')
        act(() => {
          result.current.handleKeyDown(event)
        })

        expect(result.current.selectedCellKey).toBe('1-1')
        expect(event.preventDefault).toHaveBeenCalled()
      })

      it('does not go past last row on ArrowDown', () => {
        const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

        act(() => {
          result.current.setSelectedCellKey('2-1')
        })

        const event = createKeyboardEvent('ArrowDown')
        act(() => {
          result.current.handleKeyDown(event)
        })

        expect(result.current.selectedCellKey).toBe('2-1')
      })
    })

    describe('Tab key', () => {
      it('moves right like ArrowRight', () => {
        const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

        act(() => {
          result.current.setSelectedCellKey('1-0')
        })

        const event = createKeyboardEvent('Tab')
        act(() => {
          result.current.handleKeyDown(event)
        })

        expect(result.current.selectedCellKey).toBe('1-1')
        expect(event.preventDefault).toHaveBeenCalled()
      })

      it('wraps to next row at end of column', () => {
        const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

        act(() => {
          result.current.setSelectedCellKey('0-2') // Last column of first row
        })

        const event = createKeyboardEvent('Tab')
        act(() => {
          result.current.handleKeyDown(event)
        })

        expect(result.current.selectedCellKey).toBe('1-0') // First column of second row
      })

      it('does not wrap past last row', () => {
        const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

        act(() => {
          result.current.setSelectedCellKey('2-2') // Last cell
        })

        const event = createKeyboardEvent('Tab')
        act(() => {
          result.current.handleKeyDown(event)
        })

        expect(result.current.selectedCellKey).toBe('2-2') // Stays at last cell
      })
    })

    describe('Enter key', () => {
      it('enters editing mode', () => {
        const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

        act(() => {
          result.current.setSelectedCellKey('1-1')
        })

        const event = createKeyboardEvent('Enter')
        act(() => {
          result.current.handleKeyDown(event)
        })

        expect(result.current.editingCellKey).toBe('1-1')
        expect(event.preventDefault).toHaveBeenCalled()
      })
    })

    describe('when editing', () => {
      it('does not navigate on arrow keys while editing', () => {
        const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

        act(() => {
          result.current.setSelectedCellKey('1-1')
          result.current.setEditingCellKey('1-1')
        })

        const event = createKeyboardEvent('ArrowRight')
        act(() => {
          result.current.handleKeyDown(event)
        })

        expect(result.current.selectedCellKey).toBe('1-1') // Unchanged
        expect(event.preventDefault).not.toHaveBeenCalled()
      })
    })

    describe('when target is not the cell card', () => {
      it('does not navigate when event target differs from currentTarget', () => {
        const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

        act(() => {
          result.current.setSelectedCellKey('1-1')
        })

        const innerElement = document.createElement('input')
        const cellCard = document.createElement('div')
        const event = createKeyboardEvent('ArrowRight', {
          target: innerElement,
          currentTarget: cellCard,
        })

        act(() => {
          result.current.handleKeyDown(event)
        })

        expect(result.current.selectedCellKey).toBe('1-1') // Unchanged
        expect(event.preventDefault).not.toHaveBeenCalled()
      })
    })

    describe('when no cell is selected', () => {
      it('does nothing on arrow keys', () => {
        const {result} = renderHook(() => useCellNavigation({totalRows: 3, totalCols: 3}))

        const event = createKeyboardEvent('ArrowRight')
        act(() => {
          result.current.handleKeyDown(event)
        })

        expect(result.current.selectedCellKey).toBeNull()
        expect(event.preventDefault).not.toHaveBeenCalled()
      })
    })
  })
})
