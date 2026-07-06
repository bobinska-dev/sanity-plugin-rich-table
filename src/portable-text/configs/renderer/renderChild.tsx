import {RenderChildFunction} from '@portabletext/editor'
import type {ComponentType} from 'react'
import type {BlockProps} from 'sanity'

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

const renderBuiltinChild: RenderChildFunction = (props) => {
  // Spans (text) render their decorated content unchanged.
  if (props.schemaType.name === 'span') return props.children
  // Custom inline object with no component: a styleable inline chip tagged with
  // its name so consumers can target it via CSS (e.g. [data-inline-object="foo"]).
  return (
    <span data-inline-object={props.schemaType.name} style={{whiteSpace: 'nowrap'}}>
      {props.children}
    </span>
  )
}

/**
 * Build a `renderChild` that prefers a consumer's custom inline-object component
 * (Sanity's native `components.inlineBlock` slot on the block's `children`
 * members) for the matching inline object name, falling back to the built-in
 * above. Spans always render their text children unchanged.
 */
export const createRenderChild = (
  components?: ReadonlyMap<string, InlineObjectComponent>,
): RenderChildFunction => {
  return function RenderChild(props) {
    if (props.schemaType.name === 'span') return props.children
    const Custom = components?.get(props.schemaType.name)
    if (!Custom) return renderBuiltinChild(props)
    // Inline objects are VOID nodes. The editor renders our return value with no
    // wrapper of its own (RenderChild just calls this), and its built-in default
    // sets `user-select: none` — without that the custom visual's text captures
    // the caret, so a click lands *inside* it instead of selecting the object.
    // That breaks selection, the inline-object popover, and thus editing. Wrap
    // the consumer's component so it always behaves as a void node, regardless of
    // its own styling. The editor supplies BlockChildRenderProps; the consumer's
    // component is typed for Sanity's BlockProps (same adaptation as renderAnnotation).
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
