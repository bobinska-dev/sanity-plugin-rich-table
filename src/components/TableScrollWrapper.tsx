import {Card} from '@sanity/ui'
import {styled} from 'styled-components'

/**  A styled Card component that enables horizontal scrolling.
 * When in a dialog, removes height constraints to allow dropdown menus to work properly.
 * In non-dialog mode, allows scrolling but doesn't constrain height so cells can expand when editing.
 */
export default styled(Card)<{$isInDialog?: boolean}>`
  overflow-x: ${({$isInDialog}) => ($isInDialog ? 'visible' : 'auto')};
  overflow-y: ${({$isInDialog}) => ($isInDialog ? 'visible' : 'auto')};
`
