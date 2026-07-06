import {Card, Stack, Text} from '@sanity/ui'
import {ComponentType} from 'react'
import {BlockProps} from 'sanity'

const CustomBock: ComponentType<BlockProps> = (props) => {
  return (
    <Stack>
      {/* {props.renderDefault(props)} */}
      <Card shadow={1} padding={2}>
        <Text>{props.schemaType.title}</Text>
      </Card>
    </Stack>
  )
}

export default CustomBock
