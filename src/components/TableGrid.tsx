import {Card} from '@sanity/ui'
import {styled} from 'styled-components'

import {buildGridColumnTemplate} from '../utils/buildGridColumnTemplate'

const MINMAX_HEADER_ROW_HEIGHT = 30 // in px

/** A styled Card component that uses CSS Grid to layout its children in a grid format.
 */
export default styled(Card)<{
  $columnCount: number
  $rowCount: number
  $isInDialog: boolean
  $hasRowTitles?: boolean
  /** Per content-column width in px (drag-handle sized); `undefined` entries fall
   * back to the default track. Index-aligned with the column headers. */
  $columnWidths?: Array<number | undefined>
}>`
  display: grid !important;

  grid-template-columns: ${(props) =>
    buildGridColumnTemplate({
      columnCount: props.$columnCount,
      hasRowTitles: props.$hasRowTitles,
      columnWidths: props.$columnWidths,
    })};

  grid-template-rows: ${(props) => {
    if (!props.$rowCount) {
      return `minmax(0, ${MINMAX_HEADER_ROW_HEIGHT}px) repeat(1, auto)`
    }
    if (props.$rowCount <= 1) {
      return `minmax(0, ${MINMAX_HEADER_ROW_HEIGHT}px)`
    }
    return `minmax(0, ${MINMAX_HEADER_ROW_HEIGHT}px) repeat(${props.$rowCount - 1}, auto)`
  }};
  min-width: 60vw;
  min-height: ${(props) => (props.$isInDialog ? '50vh' : 'auto')};
`
