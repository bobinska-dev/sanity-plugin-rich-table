import {Box} from '@sanity/ui'
import {styled} from 'styled-components'

export default styled(Box)<{
  $maxCols: number
  $maxRows: number
  $maxWidth: number
  $maxHeight: number
  $cellSize: number
  $gap: number
}>`
  display: grid !important;
  gap: ${(props) => (props.$gap ? `${props.$gap}px` : '5px')};

  grid-template-columns: ${(props) =>
    props.$maxCols && props.$cellSize
      ? `repeat(${props.$maxCols}, ${props.$cellSize}px);`
      : 'repeat(1, auto);'};

  grid-template-rows: ${(props) =>
    props.$maxRows && props.$cellSize
      ? `repeat(${props.$maxRows}, ${props.$cellSize}px);`
      : 'repeat(1, auto);'};

  max-width: ${(props) => props.$maxWidth}+ 'px';
  max-height: ${(props) => props.$maxWidth} + 'px';
`
