import {Card} from '@sanity/ui'
import {styled} from 'styled-components'

const MINMAX_HEADER_ROW_HEIGHT = 30 // in px
const ROW_COLUMN_WIDTH = 2 // in rem

const rowTitleColumnTrack = '1fr'
const rowContextColumnTrack = `${ROW_COLUMN_WIDTH}rem`
/** A styled Card component that uses CSS Grid to layout its children in a grid format.
 */
export default styled(Card)<{
  $columnCount: number
  $rowCount: number
  $isInDialog: boolean
  $hasRowTitles?: boolean
}>`
  display: grid !important;

  grid-template-columns: ${(props) => {
    const firstColumn = props.$hasRowTitles ? rowTitleColumnTrack : rowContextColumnTrack
    if (!props.$columnCount) {
      return `${firstColumn} repeat(4, 1fr)`
    }
    if (props.$columnCount <= 1) {
      return firstColumn
    }
    return `${firstColumn} repeat(${props.$columnCount - 1}, 1fr)`
  }};

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
