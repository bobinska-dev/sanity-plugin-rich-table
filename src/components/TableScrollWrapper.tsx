import {Card} from '@sanity/ui'
import {styled} from 'styled-components'

/**  A styled Card component that enables horizontal scrolling.
 * When in a dialog, removes height constraints to allow dropdown menus to work properly.
 */
export default styled(Card)<{$isInDialog?: boolean}>`
  overflow-x: ${({$isInDialog}) => ($isInDialog ? 'visible' : 'scroll')};
  max-height: ${({$isInDialog}) => ($isInDialog ? 'none' : '50vh')};
  overflow-y: ${({$isInDialog}) => ($isInDialog ? 'visible' : 'auto')};
`
