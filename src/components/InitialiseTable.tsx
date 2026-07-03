import {Box, Button, Card, Flex, Text} from '@sanity/ui'
import {ComponentType, useCallback, useEffect, useState} from 'react'
import {FormPatch, OperationsAPI, PatchEvent, SANITY_PATCH_TYPE} from 'sanity'

import {RichTableCellType} from '../schemas/cell.object'
import {ColumnHeader} from '../schemas/columnHeader.object'
import {RichTableRowType} from '../schemas/row.object'
import {createEmptyCell} from '../utils/createEmptyCell'
import {generateKey} from '../utils/generateKey'
import {onKeyDownSelectCells} from '../utils/onKeyDownSelect'
import InitialiseGrid from './InitialiseGrid'

export type TableSize = {rows: number; cols: number}

interface InitialiseTableProps {
  /** Maximum number of rows to display in the size picker */
  maxRows?: number
  /** Maximum number of columns to display in the size picker */
  maxCols?: number
  path: string
  /** Patch function from Sanity document operations for optimistic changes */
  patch: OperationsAPI['patch']
  isInPortableText?: boolean
  isInArray?: boolean
  readOnly: boolean | undefined
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void
  schemaTypeName: string
}

const CELL_SIZE = 28
const GAP = 6

const InitialiseTable: ComponentType<InitialiseTableProps> = ({
  maxRows = 10,
  maxCols = 10,
  path,
  patch,
  isInPortableText,
  isInArray,
  readOnly,
  onChange,
  schemaTypeName,
}) => {
  // * STATES
  // Selected states for selection to commit
  const [selected, setSelected] = useState<TableSize>({
    rows: 0,
    cols: 0,
  })
  // Hovered states for mouseover selection
  const [hover, setHover] = useState<TableSize>({rows: 0, cols: 0})

  // Dragging states for click-and-drag selection
  const [dragging, setDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<TableSize | null>(null)

  // * HELPERS
  const computeRect = (a: TableSize, b: TableSize) => {
    const rows = Math.abs(b.rows - a.rows) + 1
    const cols = Math.abs(b.cols - a.cols) + 1
    return {rows, cols}
  }
  const handleCommit = useCallback(
    (rowCount: number, cols: number) => {
      setSelected({rows: rowCount, cols: cols})

      // Initialise the field by setting its value to an empty object via the
      // form's `onChange`. `onChange` is the *relative-path* API, so the path
      // must be relative to this input's own value — an empty path targets the
      // field itself. Passing the absolute document path here previously threw
      // "Cannot apply deep operations on primitive values" whenever the field
      // was nested inside an array item (SAPP-3812).
      onChange(
        PatchEvent.from([
          {
            type: 'set',
            path: [],
            value: {},
            patchType: SANITY_PATCH_TYPE,
          },
        ]),
      )

      // Prepare the initial table value
      // Cells per row
      const cells: RichTableCellType[] = Array.from({length: cols ?? 1}, () => createEmptyCell())
      // New rows
      const rows: RichTableRowType[] = Array.from({length: rowCount ?? 1}, () => ({
        _type: 'row',
        cells: cells,
        _key: generateKey(),
      }))

      // New column header item (title uses current header count when available)
      const columnHeaders: Array<ColumnHeader & {_type: string}> = Array.from(
        {length: cols ?? 1},
        (_, index) => ({
          _type: 'columnHeader',
          _key: generateKey(),
          cellIndex: index,
        }),
      )
      const initialTableValue = {
        columnHeaders: columnHeaders,
        rows: rows,
        hasColumnTitles: true,
        hasRowTitles: true,
      }
      const portableBlockInitialValue = {
        ...initialTableValue,
        _type: schemaTypeName,
        _key: generateKey(),
      }

      // ** Prepare patches
      if (isInPortableText || isInArray) {
        return patch.execute([
          {
            set: {
              [path]: portableBlockInitialValue,
            },
          },
        ])
      }
      return patch.execute([
        {
          set: {
            [path]: initialTableValue,
          },
        },
      ])
    },
    [path, patch, isInPortableText, isInArray, onChange, schemaTypeName],
  )
  // * COMMIT SELECTION
  const effectiveRows = selected.rows || hover.rows
  const effectiveCols = selected.cols || hover.cols

  // window-level mouseup to finalize drag if releasing outside component
  useEffect(() => {
    const onWindowUp = () => {
      if (dragging && hover.rows > 0 && hover.cols > 0) {
        handleCommit(hover.rows, hover.cols)
      }
      setDragging(false)
      setDragStart(null)
    }
    window.addEventListener('mouseup', onWindowUp)
    return () => window.removeEventListener('mouseup', onWindowUp)
  }, [dragging, hover, handleCommit])

  return (
    <Card
      padding={3}
      border
      radius={4}
      tabIndex={0}
      onMouseLeave={() => setHover({rows: 0, cols: 0})}
      onKeyDown={(e) =>
        !readOnly &&
        onKeyDownSelectCells({
          e,
          selected,
          setSelected,
          maxCols,
          maxRows,
          onChange: () => handleCommit(selected.rows, selected.cols),
        })
      }
      onMouseUp={() => {
        if (dragging && hover.rows > 0 && hover.cols > 0) {
          handleCommit(hover.rows, hover.cols)
        }
        setDragging(false)
        setDragStart(null)
      }}
      aria-label="Table size picker"
      style={{
        display: 'inline-block',
        userSelect: 'none',
      }}
    >
      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only" // visually hidden
      >
        {hover.rows > 0 && hover.cols > 0
          ? `Selected: ${hover.rows} rows by ${hover.cols} columns`
          : 'No selection'}
      </div>
      <Flex justify={'center'}>
        <InitialiseGrid
          padding={4}
          $cellSize={CELL_SIZE}
          $gap={GAP}
          $maxHeight={Math.min(maxRows, 10) * (CELL_SIZE + GAP)}
          $maxWidth={Math.min(maxCols, 10) * (CELL_SIZE + GAP)}
          $maxRows={maxRows}
          $maxCols={maxCols}
        >
          {Array.from({length: maxRows}).map((_, rIdx) =>
            Array.from({length: maxCols}).map((__, cIdx) => {
              const rowCount = rIdx + 1
              const colCount = cIdx + 1
              const highlighted = rowCount <= effectiveRows && colCount <= effectiveCols
              const isSelected = rowCount <= selected.rows && colCount <= selected.cols
              return (
                <Button
                  key={`${rowCount}-${colCount}`}
                  onMouseEnter={() => {
                    if (dragging && dragStart) {
                      const rect = computeRect(dragStart, {rows: rowCount, cols: colCount})
                      setHover(rect)
                    } else {
                      setHover({rows: rowCount, cols: colCount})
                    }
                  }}
                  onMouseDown={(e) => {
                    if (readOnly) return
                    // only start drag on primary button
                    if (e.button !== 0) return
                    e.preventDefault()
                    e.stopPropagation()
                    setDragging(true)
                    const start = {rows: rowCount, cols: colCount}
                    setDragStart(start)
                    setHover(start)
                  }}
                  onClick={() => {
                    // keep single-click commit for accessibility
                    if (!dragging) handleCommit(rowCount, colCount)
                  }}
                  role="button"
                  aria-pressed={isSelected}
                  aria-label={`Select ${rowCount} rows by ${colCount} columns`}
                  tone={highlighted ? 'primary' : 'default'}
                  mode={highlighted ? 'default' : 'ghost'}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    boxSizing: 'border-box',
                  }}
                  disabled={readOnly}
                />
              )
            }),
          )}
        </InitialiseGrid>
      </Flex>
      <Flex align={'center'} justify={'space-around'} gap={3}>
        <Box>
          <Text size={1}>Selected: {`${hover.rows} × ${hover.cols}`}</Text>
        </Box>

        <Button
          onClick={() => {
            setSelected({rows: 0, cols: 0})
            setHover({rows: 0, cols: 0})
          }}
          mode={'bleed'}
          aria-label="Clear selection"
          fontSize={0}
          muted
          text={'Clear'}
          disabled={readOnly}
        />
      </Flex>
    </Card>
  )
}
export default InitialiseTable
