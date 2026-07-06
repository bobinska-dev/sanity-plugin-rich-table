import {RenderChildFunction} from '@portabletext/editor'
import type {ComponentType} from 'react'
import type {BlockProps} from 'sanity'

import DefaultInlineBlock from '../../components/custom-blocks/DefaultInlineBlock'

/**
 * A consumer-supplied custom inline-object component, keyed by inline object name.
 * Wired via the table-specific `components.tableInlineBlock` slot (sibling of a
 * block object's `tableBlock`) and typed against Sanity's {@link BlockProps}.
 * The sibling keeps Sanity's standard `inlineBlock` slot free for the native PT
 * input's default rendering, so the edit form still opens on the object itself
 * (see extractBlockConfig); the cell editor renders this custom component.
 *
 * NOTE: this editor is built on `@portabletext/editor`, which supplies the child
 * render props (value/schemaType/selected/focused + the rendered `children`) but
 * not Sanity's full form-interaction props — those are passed through as-is.
 * Editing is handled separately: the toolbar's InlineObjectPopover opens the
 * inline object in Sanity's native document form via `useDocumentPane().onPathOpen`.
 */
export type InlineObjectComponent = ComponentType<BlockProps>

/**
 * Build a `renderChild` that renders each inline object via the consumer's custom
 * component (the `tableInlineBlock` slot, keyed by name) when present, otherwise
 * the built-in {@link DefaultInlineBlock} preview chip — so every inline object,
 * including native types like references, renders meaningfully out of the box and
 * devs can override per type. Spans always render their text children unchanged.
 */
export const createRenderChild = (
  components?: ReadonlyMap<string, InlineObjectComponent>,
): RenderChildFunction => {
  return function RenderChild(props) {
    if (props.schemaType.name === 'span') return props.children
    const Custom = components?.get(props.schemaType.name) ?? DefaultInlineBlock
    // Inline objects are VOID nodes. The editor renders our return value with no
    // wrapper of its own (RenderChild just calls this), and its built-in default
    // sets `user-select: none` — without that the visual's text captures the
    // caret, so a click lands *inside* it instead of selecting the object, which
    // breaks selection, the inline-object popover, and thus editing. Wrap the
    // component (custom or default) so it always behaves as a void node. The
    // editor supplies BlockChildRenderProps; the component is typed for Sanity's
    // BlockProps (same adaptation as renderAnnotation).
    return (
      <span
        data-inline-object={props.schemaType.name}
        contentEditable={false}
        style={{userSelect: 'none', whiteSpace: 'nowrap'}}
      >
        <Custom {...(props as unknown as BlockProps)} />
      </span>
    )
  }
}

/** Built-in-only `renderChild` (no consumer custom components). */
export const renderChild = createRenderChild()
