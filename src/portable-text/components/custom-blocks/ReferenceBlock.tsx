import { BlockRenderProps } from '@portabletext/editor'
import {ComponentType, useEffect, useState} from 'react'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {Image, ReferenceSchemaType, ReferenceValue} from '@sanity/types'
import groq, {defineQuery} from 'groq'
import {PortableTextBlock, useClient, usePerspective} from 'sanity'
import {Subscription} from 'rxjs'
import {createImageUrlBuilder} from '@sanity/image-url'
import {DocumentIcon} from '@sanity/icons'
import {PREVIEW_SIZE} from '../../configs/renderer/renderBlock'

const ReferenceBlock:ComponentType<BlockRenderProps> = (props) => {
  // * CLIENT & IMAGE
  // Fetch the referenced document in the editor's active perspective (release/drafts stack)
  // so the preview reflects the version being edited, not always drafts.
  const {perspectiveStack} = usePerspective()
  const client = useClient({apiVersion: '2026-02-01'}).withConfig({
    requestTagPrefix: `ReferenceBlock-${props.value._key}`,
    perspective: perspectiveStack,
  })
  const imageBuilder = createImageUrlBuilder(client)

  // * PREP
  const schemaType = props.schemaType as unknown as ReferenceSchemaType
  const value = props.value as PortableTextBlock & ReferenceValue
  const refSchemaTypes = schemaType.to

  // * STATES
  const [refDoc, setRefDoc] = useState<{_type: string, title:string, subtitle:string, image:Image }|null>(null)

  const getPreviewConfigs =() => {
    // since a reference will only show the preview of the referenced document we need to check the ref schemaTypes for the preview select and prepare functions
     return refSchemaTypes.map((refSchemaType) => {
      const previewSelect = refSchemaType.preview?.select
      const previewPrepare = refSchemaType.preview?.prepare
       return {
          type: refSchemaType.name,
          select: previewSelect,
          prepare: previewPrepare,
       }
     })
  }
  const configs = getPreviewConfigs()

  const preparePreviewQuery = ()=> {
    const titleOptions = configs
      .map((config) => config?.select?.title)
      .filter((title): title is string => Boolean(title))
    const titleFragment =
      titleOptions.length === 0
        ? '"title": coalesce(name, title, headline)' // fallback to common fields if no title select is defined in the ref schema types
        : titleOptions.length > 1
          ? `"title": coalesce(${titleOptions.join(', ')})`
          : titleOptions[0] === 'title'
            ? 'title, '
            : `"title": ${titleOptions[0]}, `

    const subtitleOptions = configs
      .map((config) => config?.select?.subtitle)
      .filter((subtitle): subtitle is string => Boolean(subtitle))
    const subtitleFragment =
      subtitleOptions.length === 0
        ? '"subtitle": coalesce(description, overview, excerpt, subtitle),' // fallback to common fields if no subtitle select is defined in the ref schema types
        : subtitleOptions?.length > 1
          ? `"subtitle": coalesce(${subtitleOptions.join(', ')}),`
          : subtitleOptions[0] === 'subtitle'
            ? 'subtitle,'
            : `"subtitle": ${subtitleOptions[0]},`

    const imageOptions = configs
      .map((config) => config?.select?.media)
      .filter((media): media is string => Boolean(media))
    const imageFragment =
      imageOptions.length === 0
        ? '"image": coalesce(image, media, picture),' // fallback to media field if no media select is defined in the ref schema types
        : imageOptions?.length > 1
          ? `coalesce(${imageOptions.join(', ')}),`
          : imageOptions[0] === 'media'
            ? 'media,'
            : `"image": ${imageOptions[0]},`

    return groq`*[_id == $refId][0]{
      _type,
      ${titleFragment}
      ${subtitleFragment}
      ${imageFragment}
    }`
  }
  const query = defineQuery(preparePreviewQuery())
  const params = {refId: value._ref}

  // listen to changes in the reference and update the preview accordingly
  let subscription: Subscription
  useEffect(() => {
    if(value._ref){
      const listen = () => {
        subscription = client
          .listen(query, params, {
            visibility: 'query',
            tag: `referenceBlockL-listener-${value._key}`,
            includeResult: false,
          })
          .subscribe(() =>
            client.fetch(query, params).then((data) => {
              setRefDoc(data)
            }),
          )
      }

      client
        .fetch(query, params)
        .then((data) => {
          setRefDoc(data)
        })
        .then(listen)
        .catch(console.error)

      // * Cleanup
      // Never forget to unsubscribe from the listener
      return function cleanup() {
        if (subscription) {
          subscription.unsubscribe()
        }
      }
    }
  }, [value._ref])

  const renderMedia = () => {
    if (!refDoc?.image){
      // if there is no image we will return the schema icon and if not the document icon from Sanity Icons
      const refSchema = refSchemaTypes.find((schema) => schema.name === refDoc?._type)

      if (schemaType.icon) return (
        <schemaType.icon
          // @ts-ignore - the icon property on the schema type can be a React component but the type definitions don't reflect that, so we need to ignore the type check here
          style={{
            width: `${PREVIEW_SIZE}px`,
            height: `${PREVIEW_SIZE}px`,
            objectFit: 'cover',

            borderRadius: '4px',
            border: '1px solid var(--card-border-color)',
          }}
        />
      )
      return (
        <DocumentIcon // @ts-ignore - the icon property on the schema type can be a React component but the type definitions don't reflect that, so we need to ignore the type check here
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
    const imageUrl = imageBuilder.image(refDoc.image).width(PREVIEW_SIZE).height(PREVIEW_SIZE).url()
    return (
      <img
        src={imageUrl}
        alt={refDoc.title}
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
          {refDoc?.title && (
            <Box>
              <Text size={1} textOverflow={'ellipsis'}>
                {refDoc.title}
              </Text>
            </Box>
          )}
          {refDoc?.subtitle && (
            <Box paddingTop={1}>
              <Text size={0} muted textOverflow={'ellipsis'}>
                {refDoc.subtitle}
              </Text>
            </Box>
          )}
        </Stack>
      </Flex>
    </Card>
  )
}
export default ReferenceBlock
