import {BlockRenderProps} from '@portabletext/editor'
import {createImageUrlBuilder} from '@sanity/image-url'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {ComponentType} from 'react'
import {useClient} from 'sanity'

const ImageBlock: ComponentType<BlockRenderProps> = (props) => {
  const client = useClient({apiVersion: '2026-02-01'}).withConfig({
    requestTagPrefix: `ImageBlock-${props.value._key}`,
  })
  // An image block can exist before an asset is uploaded; @sanity/image-url
  // throws "Unable to resolve image URL from source" for an asset-less value, so
  // only build the preview URL once there's an asset reference.
  const asset = (props.value as {asset?: {_ref?: string}}).asset
  const imageUrl = asset?._ref
    ? createImageUrlBuilder(client).image(props.value).width(30).height(30).url()
    : undefined

  // @ts-expect-error - props.value is typed as a base image without the optional `alt` field
  const altText = props.value.alt || 'Image does not have alt text'
  // TODO: Add support for other fields in the block, such as caption or credit
  return (
    <Card
      shadow={1}
      padding={2}
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
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={altText}
            style={{
              width: '30px',
              height: '30px',
              objectFit: 'cover',
              borderRadius: '4px',
              border: '1px solid var(--card-border-color)',
            }}
          />
        ) : (
          <Box
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '4px',
              border: '1px dashed var(--card-border-color)',
            }}
          />
        )}

        <Stack space={2}>
          <Box>
            <Text size={1} textOverflow={'ellipsis'}>
              {props.schemaType.title || 'Image block'}
            </Text>
          </Box>
          <Box>
            <Text muted size={0} textOverflow={'ellipsis'}>
              {imageUrl ? 'Image block' : 'No image selected'}
            </Text>
          </Box>
        </Stack>
      </Flex>
    </Card>
  )
}
export default ImageBlock
