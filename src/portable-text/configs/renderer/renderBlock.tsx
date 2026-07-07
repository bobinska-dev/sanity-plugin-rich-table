import {RenderBlockFunction} from '@portabletext/editor'
import type {ReactElement} from 'react'
import {ArraySchemaType, Path, PortableTextBlock} from 'sanity'

import BlockEditWrapper from '../../components/custom-blocks/BlockEditWrapper'
import DefaultCustomBlock from '../../components/custom-blocks/DefaultCustomBlock'
import ImageBlock from '../../components/custom-blocks/ImageBlock'
import ReferenceBlock from '../../components/custom-blocks/ReferenceBlock'
import {extendsType} from '../../schemaTypeChain'

export const PREVIEW_SIZE = 30

export interface RenderBlockOptions {
  configSchema?: ArraySchemaType<PortableTextBlock>
  /** Absolute path of the cell's content array, so a block's edit form can be
   * opened on double-click via `onPathOpen(path.concat({_key}))`. */
  path?: Path
}

export const renderBlock = (options?: RenderBlockOptions): RenderBlockFunction => {
  // Captured in closure when ContentPortableTextEditor calls renderBlock({ portableTextSchemaTypeName })
  const customPTschema = options?.configSchema
  const basePath = options?.path
  return function RenderBlock(props) {
    const currentSchema = customPTschema?.of?.find(
      (schema) => schema.name === props.schemaType.name,
    )
    // Double-clicking a block object opens its native edit form (same mechanism as
    // the toolbar's BlockPopover). Needs the block's absolute path; skip the wrap
    // if the base path wasn't supplied.
    const blockKey = (props.value as {_key?: string})?._key
    const blockPath = basePath && blockKey ? basePath.concat([{_key: blockKey}]) : undefined
    const withEdit = (node: ReactElement): ReactElement =>
      blockPath ? <BlockEditWrapper path={blockPath}>{node}</BlockEditWrapper> : node
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
    if (CustomBlock) return withEdit(<CustomBlock {...props} />)

    if (props.listItem) return props.children

    // `props.schemaType` is the editor's minimal type (name/fields only). The
    // original Sanity schema — which carries `preview`, `icon` and a reference's
    // `to` — is `currentSchema`; hand it to the built-in fallbacks so they can
    // build a real preview instead of an empty card.
    const withSchema = {
      ...props,
      schemaType: (currentSchema ?? props.schemaType) as unknown as typeof props.schemaType,
    }
    const original = currentSchema as {name?: string; to?: unknown} | undefined

    // Route by BASE type, not the exact member name: a *named* image member
    // (e.g. `imageWithCaption`) must still get ImageBlock, otherwise it falls
    // through to DefaultCustomBlock which renders the asset object and crashes
    // with "Objects are not valid as a React child".
    if (props.schemaType.name === 'image' || extendsType(currentSchema, 'image')) {
      return withEdit(<ImageBlock {...withSchema} />)
    }
    // Route by BASE type too: a reference carries `to` (its allowed targets) even
    // when it's a *named* array member (e.g. `fallbackReference`), and its compiled
    // `.type` chain reaches `reference`. Walk that chain (like the image branch) so
    // named references still get the document preview instead of the generic card.
    if (
      props.schemaType.name === 'reference' ||
      extendsType(currentSchema, 'reference') ||
      Array.isArray(original?.to)
    ) {
      return withEdit(<ReferenceBlock {...withSchema} />)
    }

    if (props.schemaType.name === 'block')
      return <div style={{padding: '0.25rem 0'}}>{props.children}</div>
    return withEdit(<DefaultCustomBlock {...withSchema} />)
  }
}
