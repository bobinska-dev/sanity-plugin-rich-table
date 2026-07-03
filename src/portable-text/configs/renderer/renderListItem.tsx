import {BlockListItemRenderProps, RenderListItemFunction} from '@portabletext/editor'
import {useListIndex} from '@portabletext/plugin-list-index'
import {ComponentType, CSSProperties} from 'react'
import {styled} from 'styled-components'

const StyledLi = styled.li<{$level: number}>`
  display: flex;
  align-items: baseline;
  margin-left: ${(props) => (props.$level ? `${props.$level * 0.35}rem` : '0rem')};
  padding: 0;
  list-style: none;

  /* Marker content comes from the --rt-list-marker custom property, set per item
     from the computed list index (numbers) or a bullet glyph. */
  &::before {
    content: var(--rt-list-marker);
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

/**
 * List item render component.
 *
 * Portable Text stores list items as flat sibling blocks with a `level`, so an
 * ordered item's number is a derived value. We use `useListIndex` from
 * `@portabletext/plugin-list-index` to get the correct 1-based index (it stays
 * correct under nesting, remote edits, and normalization), replacing the old
 * hand-tuned CSS `counter-reset` scheme that had to be coordinated per level.
 */
const ListItem: ComponentType<BlockListItemRenderProps> = (props) => {
  const isNumber = props.schemaType.value === 'number'
  const index = useListIndex(props.path)
  const marker = isNumber ? `"${index ?? 1}."` : '"\\2022"'

  return (
    <StyledLi
      $level={props.level}
      role="listitem"
      data-list-item={isNumber ? 'number' : 'bullet'}
      data-list-level={props.level}
      style={{'--rt-list-marker': marker} as CSSProperties}
    >
      {props.children}
    </StyledLi>
  )
}

export const renderListItem: RenderListItemFunction = (props) => <ListItem {...props} />
