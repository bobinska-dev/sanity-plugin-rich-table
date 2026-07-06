import {RenderBlockFunction} from '@portabletext/editor'
import {ArraySchemaType, PortableTextBlock} from 'sanity'

import DefaultCustomBlock from '../../components/custom-blocks/DefautCustomBlock'
import ImageBlock from '../../components/custom-blocks/ImageBlock'
import ReferenceBlock from '../../components/custom-blocks/ReferenceBlock'

export const PREVIEW_SIZE = 30

export interface RenderBlockOptions {
  configSchema?: ArraySchemaType<PortableTextBlock>
}

export const renderBlock = (options?: RenderBlockOptions): RenderBlockFunction => {
  // Captured in closure when ContentPortableTextEditor calls renderBlock({ portableTextSchemaTypeName })
  const customPTschema = options?.configSchema
  return function RenderBlock(props) {
    const currentSchema = customPTschema?.of?.find(
      (schema) => schema.name === props.schemaType.name,
    )
    // Prefer the table-specific `tableBlock` component (the convention this plugin
    // augments onto Object/Image/ReferenceComponents), falling back to the standard
    // `block` component. The *compiled* schema type exposes a fixed `components` shape
    // that omits `tableBlock`, so read it through a shape that adds it (reusing the same
    // component type as the standard `block` slot).
    type SchemaComponents = NonNullable<NonNullable<typeof currentSchema>['components']>
    const components = currentSchema?.components as
      | (SchemaComponents & {tableBlock?: SchemaComponents['block']})
      | undefined
    const CustomBlock = components?.tableBlock ?? components?.block
    if (CustomBlock) return <CustomBlock {...props} />

    if (props.listItem) return props.children
    if (props.schemaType.name === 'image') {
      return <ImageBlock {...props} />
    }
    if (props.schemaType.name === 'reference') return <ReferenceBlock {...props} />

    if (props.schemaType.name === 'block')
      return <div style={{padding: '0.25rem 0'}}>{props.children}</div>
    return <DefaultCustomBlock {...props} />
  }
}
