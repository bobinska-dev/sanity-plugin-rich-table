import {PortableTextEditable} from '@portabletext/editor'
import {styled} from 'styled-components'

export const StyledPortableTextEditable = styled(PortableTextEditable)`
  border-radius: 0.0625rem;
  padding: 0.9rem;
  height: stretch;

  /* Reset CSS counters at the editor level */
  counter-reset: list-counter-1 list-counter-2 list-counter-3 list-counter-4;

  /* Reset counters when a numbered list starts after a non-list element */
  & > :not([data-list-item='number']) + [data-list-item='number'] {
    counter-reset: list-counter-1 list-counter-2 list-counter-3 list-counter-4;
  }

  /* Reset deeper level counters when going to a shallower level */
  & > [data-list-level='1'] {
    counter-reset: list-counter-2 list-counter-3 list-counter-4;
  }
  & > [data-list-level='2'] {
    counter-reset: list-counter-3 list-counter-4;
  }
  & > [data-list-level='3'] {
    counter-reset: list-counter-4;
  }
`
