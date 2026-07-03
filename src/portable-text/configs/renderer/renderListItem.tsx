import {RenderListItemFunction} from '@portabletext/editor'
import {styled} from 'styled-components'

const StyledLi = styled.li<{$level: number; $listType: 'bullet' | 'number'}>`
  display: flex;
  align-items: baseline;
  margin-left: ${(props) => (props.$level ? `${props.$level * 0.35}rem` : '0rem')};
  padding: 0;
  list-style: none;

  /* Use CSS counters for numbered lists */
  counter-increment: ${(props) =>
    props.$listType === 'number' ? `list-counter-${props.$level}` : 'none'};

  &::before {
    content: ${(props) =>
      props.$listType === 'number' ? `counter(list-counter-${props.$level}) "."` : '"\\2022"'};
    flex-shrink: 0;
    min-width: 1.2em;
    font-size: 0.8125rem;
    text-align: right;
    margin-right: 0.3em;
  }

  /* Reset padding/margin on child content so the marker stays aligned */
  > * {
    margin: 0;
    padding-bottom: 0;
    margin-bottom: 0;
  }

  /* Remove any transforms that might affect alignment */
  > * > div {
    transform: none !important;
  }
`

export const renderListItem: RenderListItemFunction = (props) => {
  const listType = props.schemaType.value
  const isNumber = listType === 'number'

  return (
    <StyledLi
      $level={props.level}
      $listType={isNumber ? 'number' : 'bullet'}
      role="listitem"
      data-list-item={isNumber ? 'number' : 'bullet'}
      data-list-level={props.level}
    >
      {props.children}
    </StyledLi>
  )
}
