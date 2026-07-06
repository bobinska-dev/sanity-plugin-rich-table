import {BlockRenderProps} from '@portabletext/editor'
import {ObjectSchemaType, PreviewValue} from '@sanity/types'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {ComponentType, CSSProperties, ReactNode} from 'react'

import {PREVIEW_SIZE} from '../../configs/renderer/renderBlock'

// A muted icon glyph, smaller than the PREVIEW_SIZE box, so an icon-only preview
// reads like the image fallback's thumbnail rather than a big filled square.
const ICON_GLYPH_SIZE = 18

// TODO: file bug for props.value not updating (Christian)
const DefaultCustomBlock: ComponentType<BlockRenderProps> = (props) => {
  // The editor's BlockRenderProps.schemaType is a stripped BlockObjectSchemaType;
  // read Sanity's `preview`/`icon`/`title` through the object schema shape.
  const schemaType = props.schemaType as unknown as ObjectSchemaType

  const getPreviewSelection = (): PreviewValue => {
    // Use the schema's `preview` (select + optional prepare) to build the preview
    // from the value's fields, like a normal Sanity preview.
    const previewSelect = schemaType.preview?.select
    const previewPrepare = schemaType.preview?.prepare
    if (previewSelect) {
      const selection = Object.keys(previewSelect).reduce(
        (acc, key) => {
          // Preview field values are arbitrary/dynamic.
          acc[key] = (props.value as Record<string, unknown>)[previewSelect[key]]
          return acc
        },
        {} as Record<string, unknown>,
      )
      const prepared = (previewPrepare ? previewPrepare(selection) : selection) as PreviewValue
      if (prepared?.title || prepared?.subtitle || prepared?.media) return prepared
    }
    // No usable preview config: derive a title from the first string field (as
    // Sanity's default preview does), then fall back to the type title / name.
    const firstString = Object.entries((props.value as Record<string, unknown>) ?? {}).find(
      ([key, v]) => !key.startsWith('_') && typeof v === 'string' && v.trim() !== '',
    )?.[1]
    return {
      title: (firstString as string | undefined) ?? (schemaType.title as string) ?? schemaType.name,
    }
  }

  const preview = getPreviewSelection()

  const renderMedia = (): ReactNode => {
    if (!preview.media && !schemaType.icon) return null
    if (!preview.media && schemaType.icon) {
      const Icon = schemaType.icon as unknown as ComponentType<{style?: CSSProperties}>
      return (
        <Flex
          align="center"
          justify="center"
          style={{
            width: `${PREVIEW_SIZE}px`,
            height: `${PREVIEW_SIZE}px`,
            borderRadius: '4px',
            border: '1px solid var(--card-border-color)',
            color: 'var(--card-muted-fg-color)',
            flexShrink: 0,
          }}
        >
          <Icon style={{width: ICON_GLYPH_SIZE, height: ICON_GLYPH_SIZE}} />
        </Flex>
      )
    }
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
