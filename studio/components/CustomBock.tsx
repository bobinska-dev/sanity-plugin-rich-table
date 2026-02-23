import {Stack, Text} from '@sanity/ui'
import {ComponentType} from 'react'
import {BlockProps} from 'sanity'

const CustomBock: ComponentType<BlockProps> = (props) => {
  return (
    <Stack>
      {props.renderDefault(props)}
      <Text>Custom Block</Text>
    </Stack>
  )
}

export default CustomBock
