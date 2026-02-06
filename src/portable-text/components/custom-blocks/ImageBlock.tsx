import {ComponentType} from 'react'
import {BlockRenderProps} from '@portabletext/editor'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'
import {createImageUrlBuilder} from '@sanity/image-url'

const ImageBlock:ComponentType<BlockRenderProps> = (props) => {

  const client = useClient({apiVersion:'2026-02-01'}).withConfig({requestTagPrefix: `ImageBlock-${props.value._key}`})
  const imageBuilder = createImageUrlBuilder(client).image(props.value)
  const imageUrl = imageBuilder.width(30).height(30).url()

  // @ts-ignore
  const altText = props.value.alt || 'Image does not have alt text'
  const fields = props.schemaType.fields.filter((field) =>
    !['asset' , 'crop' , 'hotspot' , '_key' , '_type', 'media'].includes(field.name),
  )
  // TODO: Add support for other fields in the block, such as caption or credit
  return (
    <Card
      shadow={1}
      padding={1}
      radius={1}
      marginY={2}
      style={
        props.selected
          ? {
              // focus styles for the block when selected in the editor
              boxShadow:
                'inset 0 0 0 0px var(--card-border-color), 0 0 0 1px var(--card-focus-ring-color)',
            }
          : undefined
      }
    >
      <Flex gap={2} align={'center'}>
        <Flex justify={'center'} align={'center'}>
          {imageUrl && <img src={imageUrl} alt={altText} />}
        </Flex>
        <Stack>
          <Box>
            <Text muted size={0}>
              {props.schemaType.title || 'Image block'}
            </Text>
          </Box>
        </Stack>
      </Flex>
    </Card>
  )
}
export default ImageBlock

