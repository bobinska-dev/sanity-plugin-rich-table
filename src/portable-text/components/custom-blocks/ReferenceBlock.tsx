import { BlockRenderProps } from '@portabletext/editor'
import {ComponentType, useEffect, useState} from 'react'
import {Card} from '@sanity/ui'
import {Image, ReferenceSchemaType, ReferenceValue} from '@sanity/types'
import groq, {defineQuery} from 'groq'
import {PortableTextBlock, useClient} from 'sanity'
import {Subscription} from 'rxjs'

const ReferenceBlock:ComponentType<BlockRenderProps> = (props) => {
  const client = useClient({apiVersion:'2026-02-01'}).withConfig({requestTagPrefix: `ReferenceBlock-${props.value._key}`, perspective:'drafts'})

  const schemaType = props.schemaType as ReferenceSchemaType
  const value = props.value as PortableTextBlock & ReferenceValue

  // States
  const [refDoc, setRefDoc] = useState<{_type: string, title:string, subtitle:string, image:Image }|null>(null)

  const refSchemaTypes = schemaType.to
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
  console.log('refDoc', refDoc)

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
      hello
    </Card>
  )
}
export default ReferenceBlock
