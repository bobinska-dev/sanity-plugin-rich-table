import {describe, expect, it} from 'vitest'

import {
  buildGridColumnTemplate,
  CONTENT_COLUMN_DEFAULT_TRACK,
} from '../../utils/buildGridColumnTemplate'

describe('buildGridColumnTemplate', () => {
  it('falls back to four equal columns when the table is empty', () => {
    expect(buildGridColumnTemplate({columnCount: 0, hasRowTitles: true})).toBe('1fr repeat(4, 1fr)')
  })

  it('uses a stretching first column when row titles are shown', () => {
    expect(buildGridColumnTemplate({columnCount: 3, hasRowTitles: true})).toBe(
      `1fr ${CONTENT_COLUMN_DEFAULT_TRACK} ${CONTENT_COLUMN_DEFAULT_TRACK}`,
    )
  })

  it('uses a narrow fixed first column when row titles are hidden', () => {
    expect(buildGridColumnTemplate({columnCount: 3, hasRowTitles: false})).toBe(
      `2rem ${CONTENT_COLUMN_DEFAULT_TRACK} ${CONTENT_COLUMN_DEFAULT_TRACK}`,
    )
  })

  it('renders only the first column when there are no content columns', () => {
    expect(buildGridColumnTemplate({columnCount: 1, hasRowTitles: true})).toBe('1fr')
  })

  it('emits a fixed px track for a sized column and the default for the rest', () => {
    expect(
      buildGridColumnTemplate({
        columnCount: 4,
        hasRowTitles: true,
        columnWidths: [120, undefined, 200],
      }),
    ).toBe(`1fr 120px ${CONTENT_COLUMN_DEFAULT_TRACK} 200px`)
  })

  it('ignores non-positive widths and falls back to the default track', () => {
    expect(
      buildGridColumnTemplate({columnCount: 3, hasRowTitles: true, columnWidths: [0, -10]}),
    ).toBe(`1fr ${CONTENT_COLUMN_DEFAULT_TRACK} ${CONTENT_COLUMN_DEFAULT_TRACK}`)
  })

  it('pads missing width entries with the default track', () => {
    expect(buildGridColumnTemplate({columnCount: 3, hasRowTitles: true, columnWidths: [150]})).toBe(
      `1fr 150px ${CONTENT_COLUMN_DEFAULT_TRACK}`,
    )
  })
})
