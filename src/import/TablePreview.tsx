import {Box, Card, Text} from '@sanity/ui'
import type {CSSProperties} from 'react'

import {cellToText} from './cellToText'
import type {ParsedTable, ParseWarning} from './types'

const MAX_PREVIEW_ROWS = 20

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
  lineHeight: 1.4,
}

const thStyle: CSSProperties = {
  padding: '6px 10px',
  textAlign: 'left',
  fontWeight: 600,
  borderBottom: '2px solid var(--card-border-color)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 200,
}

const tdStyle: CSSProperties = {
  padding: '5px 10px',
  borderBottom: '1px solid var(--card-border-color)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 200,
}

const rowTitleTdStyle: CSSProperties = {
  ...tdStyle,
  fontWeight: 600,
}

const warningTdStyle: CSSProperties = {
  ...tdStyle,
  color: 'var(--card-badge-caution-fg-color)',
  fontStyle: 'italic',
}

interface TablePreviewProps {
  table: ParsedTable
  warnings: ParseWarning[]
  /** When true, renders the first data column with header-like styling. */
  hasRowTitles?: boolean
}

/**
 * Renders a compact read-only preview of a {@link ParsedTable} inside the
 * import dialog. Shows headers, the first {@link MAX_PREVIEW_ROWS} data rows,
 * and visually flags cells that produced parse warnings. When `hasRowTitles`
 * is set, the first column is rendered with bold/header styling.
 */
export function TablePreview({table, warnings, hasRowTitles}: TablePreviewProps) {
  const {headers, rows} = table
  const previewRows = rows.slice(0, MAX_PREVIEW_ROWS)
  const cols = Math.max(headers?.length ?? 0, ...rows.map((r) => r.length))

  const warningSet = new Set(warnings.map((w) => `${w.row}:${w.col}`))

  return (
    <Card overflow="auto" style={{maxHeight: 280}}>
      <table style={tableStyle}>
        {headers && (
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} style={thStyle}>
                  {h || (
                    <Text size={0} muted>
                      &mdash;
                    </Text>
                  )}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {previewRows.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {Array.from({length: cols}, (_, colIdx) => {
                const cell = row[colIdx]
                const isWarning = warningSet.has(`${rowIdx}:${colIdx}`)
                const isRowTitle = hasRowTitles && colIdx === 0
                const text = cellToText(cell)

                let style = tdStyle
                if (isWarning) style = warningTdStyle
                else if (isRowTitle) style = rowTitleTdStyle

                return (
                  <td key={colIdx} style={style}>
                    {text || '\u00A0'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > MAX_PREVIEW_ROWS && (
        <Box paddingY={2} paddingX={3}>
          <Text size={0} muted>
            Showing {MAX_PREVIEW_ROWS} of {rows.length} rows…
          </Text>
        </Box>
      )}
    </Card>
  )
}
