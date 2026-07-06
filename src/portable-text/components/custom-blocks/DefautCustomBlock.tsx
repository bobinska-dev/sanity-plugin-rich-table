import {BlockRenderProps} from '@portabletext/editor'
import {ObjectSchemaType, PreviewValue} from '@sanity/types'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {ComponentType, CSSProperties, ReactNode} from 'react'

import {PREVIEW_SIZE} from '../../configs/renderer/renderBlock'

// TODO: file bug for props.value not updating (Christian)
const DefaultCustomBlock: ComponentType<BlockRenderProps> = (props) => {
  // The editor's BlockRenderProps.schemaType is a stripped BlockObjectSchemaType;
  // read Sanity's `preview`/`icon`/`title` through the object schema shape.
  const schemaType = props.schemaType as unknown as ObjectSchemaType

  const getPreviewSelection = () => {
    // we use the schemaType.preview select to get the field values from props.value, and then use the preview prepare function to format the title for the block preview
    const previewSelect = schemaType.preview?.select || {}
    const previewPrepare = schemaType.preview?.prepare
    const selection = Object.keys(previewSelect).reduce(
      (acc, key) => {
        // Preview field values are arbitrary/dynamic, so `any` is the pragmatic type here.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        acc[key] = (props.value as Record<string, any>)[previewSelect[key]]
        return acc
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {} as Record<string, any>,
    )

    if (previewPrepare) return previewPrepare(selection) as PreviewValue
    if (selection) return selection
    return {title: schemaType.title}
  }

  const preview = getPreviewSelection()

  const renderMedia = (): ReactNode => {
    if (!preview.media && !schemaType.icon) return null
    if (!preview.media && schemaType.icon)
      return (
        <schemaType.icon
          // @ts-expect-error - the icon property on the schema type can be a React component but the type definitions don't reflect that, so we need to ignore the type check here
          style={{
            width: `${PREVIEW_SIZE}px`,
            height: `${PREVIEW_SIZE}px`,
            objectFit: 'cover',
            borderRadius: '4px',
            border: '1px solid var(--card-border-color)',
          }}
        />
      )
    // If media is a component type (function/class), instantiate it
    if (typeof preview.media === 'function') {
      const Media = preview.media as ComponentType<{style?: CSSProperties}>
      return (
        <Media
          style={{
            width: `${PREVIEW_SIZE}px`,
            height: `${PREVIEW_SIZE}px`,
            objectFit: 'cover',
            borderRadius: '4px',
            border: '1px solid var(--card-border-color)',
          }}
        />
      )
    }
    // Otherwise assume it's already a React node (element, string, etc.)
    return preview.media as ReactNode
  }
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
      <Flex align={'center'} gap={2}>
        {renderMedia()}
        <Stack space={2}>
          {preview.title && (
            <Box>
              <Text size={1} textOverflow={'ellipsis'}>
                {preview.title}
              </Text>
            </Box>
          )}
          {preview.subtitle && (
            <Box paddingTop={1}>
              <Text size={0} muted textOverflow={'ellipsis'}>
                {preview.subtitle}
              </Text>
            </Box>
          )}
        </Stack>
      </Flex>
    </Card>
  )
}

export default DefaultCustomBlock
