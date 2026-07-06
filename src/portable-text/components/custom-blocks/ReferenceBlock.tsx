import {BlockRenderProps} from '@portabletext/editor'
import {DocumentIcon} from '@sanity/icons'
import {createImageUrlBuilder} from '@sanity/image-url'
import {Image, ReferenceSchemaType, ReferenceValue} from '@sanity/types'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import groq, {defineQuery} from 'groq'
import {ComponentType, CSSProperties, useEffect, useState} from 'react'
import {Subscription} from 'rxjs'
import {
  DocumentStatusIndicator,
  getPublishedId,
  PortableTextBlock,
  useClient,
  useEditState,
  usePerspective,
} from 'sanity'

import {PREVIEW_SIZE} from '../../configs/renderer/renderBlock'

// A muted icon glyph, smaller than the PREVIEW_SIZE box, so an icon-only preview
// reads like the image fallback's thumbnail rather than a big filled square.
const ICON_GLYPH_SIZE = 18

const ReferenceBlock: ComponentType<BlockRenderProps> = (props) => {
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
  const [refDoc, setRefDoc] = useState<{
    _type: string
    title: string
    subtitle: string
    image: Image
  } | null>(null)

  // Document status (draft / published / edited) of the referenced document, so
  // the preview mirrors Sanity's native reference status dot. A reference stores
  // the published id; the type comes from the resolved doc or the first allowed
  // target type.
  const publishedId = value._ref ? getPublishedId(value._ref) : ''
  const refTypeName =
    (refDoc?._type as string | undefined) ?? (refSchemaTypes?.[0]?.name as string | undefined) ?? ''
  const editState = useEditState(publishedId, refTypeName)

  const getPreviewConfigs = () => {
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

  const preparePreviewQuery = () => {
    const titleOptions = configs
      .map((config) => config?.select?.title)
      .filter((title): title is string => Boolean(title))
    let titleFragment: string
    if (titleOptions.length === 0) {
      // fallback to common fields if no title select is defined in the ref schema types
      titleFragment = '"title": coalesce(name, title, headline)'
    } else if (titleOptions.length > 1) {
      titleFragment = `"title": coalesce(${titleOptions.join(', ')})`
    } else if (titleOptions[0] === 'title') {
      titleFragment = 'title, '
    } else {
      titleFragment = `"title": ${titleOptions[0]}, `
    }

    const subtitleOptions = configs
      .map((config) => config?.select?.subtitle)
      .filter((subtitle): subtitle is string => Boolean(subtitle))
    let subtitleFragment: string
    if (subtitleOptions.length === 0) {
      // fallback to common fields if no subtitle select is defined in the ref schema types
      subtitleFragment = '"subtitle": coalesce(description, overview, excerpt, subtitle),'
    } else if (subtitleOptions.length > 1) {
      subtitleFragment = `"subtitle": coalesce(${subtitleOptions.join(', ')}),`
    } else if (subtitleOptions[0] === 'subtitle') {
      subtitleFragment = 'subtitle,'
    } else {
      subtitleFragment = `"subtitle": ${subtitleOptions[0]},`
    }

    const imageOptions = configs
      .map((config) => config?.select?.media)
      .filter((media): media is string => Boolean(media))
    let imageFragment: string
    if (imageOptions.length === 0) {
      // fallback to media field if no media select is defined in the ref schema types
      imageFragment = '"image": coalesce(image, media, picture),'
    } else if (imageOptions.length > 1) {
      imageFragment = `coalesce(${imageOptions.join(', ')}),`
    } else if (imageOptions[0] === 'media') {
      imageFragment = 'media,'
    } else {
      imageFragment = `"image": ${imageOptions[0]},`
    }

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
  useEffect(() => {
    // Scoped inside the effect so the cleanup closes over this run's subscription
    // (a component-scope `let` reassigned from within the effect is reset every
    // render and would be lost — react-hooks/exhaustive-deps). `cancelled` guards
    // against a fast unmount / `_ref` change resolving the async fetch chain after
    // teardown: it prevents setState-after-unmount and stops `listen()` from
    // opening a subscription the (already-run) cleanup could never unsubscribe.
    let cancelled = false
    let subscription: Subscription | undefined
    if (value._ref) {
      const listen = () => {
        if (cancelled) return
        subscription = client
          .listen(query, params, {
            visibility: 'query',
            tag: `referenceBlockL-listener-${value._key}`,
            includeResult: false,
          })
          .subscribe(() =>
            client.fetch(query, params).then((data) => {
              if (!cancelled) setRefDoc(data)
            }),
          )
      }

      client
        .fetch(query, params)
        .then((data) => {
          if (!cancelled) setRefDoc(data)
        })
        .then(listen)
        .catch((error) => {
          if (!cancelled) console.error(error)
        })

      // * Cleanup
      // Never forget to unsubscribe from the listener
      return function cleanup() {
        cancelled = true
        if (subscription) {
          subscription.unsubscribe()
        }
      }
    }
    return undefined
    // Intentionally keyed on the reference id only: `query` is schema-derived
    // (stable), `params`/`value._key` derive from `value._ref`, and `client` is
    // stable — listing them would re-subscribe on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value._ref])

  // A small muted icon centered in a PREVIEW_SIZE box, matching the image
  // fallback's thumbnail footprint (used when the doc has no preview image).
  const iconBox = (Icon: ComponentType<{style?: CSSProperties}>) => (
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

  const renderMedia = () => {
    if (!refDoc?.image) {
      // No preview image: show the schema icon, else Sanity's document icon.
      if (schemaType.icon)
        return iconBox(schemaType.icon as unknown as ComponentType<{style?: CSSProperties}>)
      return iconBox(DocumentIcon)
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
        <Stack flex={1} gap={2} style={{minWidth: 0}}>
          {/* Always render a title so an empty or not-yet-resolved reference
              isn't blank: the fetched title, else a state-appropriate hint. */}
          <Box>
            <Text size={1} textOverflow={'ellipsis'} muted={!refDoc?.title}>
              {refDoc?.title ?? (value._ref ? 'Referenced document' : 'No document selected')}
            </Text>
          </Box>
          {refDoc?.subtitle && (
            <Box paddingTop={1}>
              <Text size={0} muted textOverflow={'ellipsis'}>
                {refDoc.subtitle}
              </Text>
            </Box>
          )}
        </Stack>
        {/* Status dot (draft / published / edited) right-aligned, like Sanity's
            default reference preview. */}
        {value._ref && (editState.draft || editState.published) && (
          <Box flex="none">
            <DocumentStatusIndicator
              draft={editState.draft ?? undefined}
              published={editState.published ?? undefined}
            />
          </Box>
        )}
      </Flex>
    </Card>
  )
}
export default ReferenceBlock
