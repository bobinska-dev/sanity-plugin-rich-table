import {ComponentType, ReactNode, useCallback, useMemo} from 'react'
import {BlockRenderProps} from '@portabletext/editor'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {PreviewValue} from '@sanity/types'
import styled from 'styled-components'

// TODO: file bug for props.value not updating (Christian)
const DefaultCustomBlock:ComponentType<BlockRenderProps> = (props) => {
  console.log(props)

  const getPreviewSelection =() => {
    // we use the props.schemaType.preview select to get the field values from props.value, and then use the preview prepare function to format the title for the block preview
    const previewSelect = props.schemaType.preview?.select || {}
    const previewPrepare =
      props.schemaType.preview?.prepare
    const selection = Object.keys(previewSelect).reduce(
      (acc, key) => {
        acc[key] = (props.value as Record<string, any>)[previewSelect[key]]
        return acc
      },
      {} as Record<string, any>,
    )

    if (previewPrepare) return previewPrepare(selection) as PreviewValue
    if(selection) return selection
    return {title: props.schemaType.title}
  }

  const preview = useMemo(() => getPreviewSelection(), [getPreviewSelection, props.value])

  const renderMedia = (): ReactNode => {
    if (!preview.media && !props.schemaType.icon) return null
    if (!preview.media && props.schemaType.icon) return <props.schemaType.icon />
    // If media is a component type (function/class), instantiate it
    if (typeof preview.media === 'function') {
      const Media = preview.media as ComponentType<any>
      return <Media />
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
