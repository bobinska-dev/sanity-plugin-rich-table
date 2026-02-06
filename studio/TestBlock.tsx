import {ComponentType} from 'react'
import BlockPopover from '../src/portable-text/components/custom-blocks/BlockPopover'
import {BlockProps} from 'sanity'
import {Card} from '@sanity/ui'


const TestBlock:ComponentType<BlockProps> = (props) => <Card tone={'positive'} style={{height: '30px'}}>{props.value._type}</Card>
export default TestBlock
