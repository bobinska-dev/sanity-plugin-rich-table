import {Card} from '@sanity/ui'
import {styled} from 'styled-components'

/**  A styled Card component that enables horizontal scrolling.
 */
export default styled(Card)`
  overflow-x: scroll;
  max-height: 50vh;
  overflow-y: auto;
`
