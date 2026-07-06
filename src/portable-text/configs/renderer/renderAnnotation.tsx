import {RenderAnnotationFunction} from '@portabletext/editor'
import type {ComponentType} from 'react'
import type {BlockAnnotationProps} from 'sanity'

/**
 * A consumer-supplied custom annotation component, keyed by annotation name.
 * Wired via the table-specific `components.tableAnnotation` slot (sibling of a
 * block object's `tableBlock`) and typed against Sanity's {@link BlockAnnotationProps}.
 *
 * The sibling matters: Sanity's native PTE renders annotations via
 * `props.renderDefault`, which `@portabletext/editor` does not provide (the cell
 * editor supplies the annotated text as `props.children`). Keeping the cell
 * visual on `tableAnnotation` leaves the native `annotation` slot for Sanity's
 * default rendering (debug/document view). Editing is handled separately: the
 * toolbar's AnnotationPopover opens the annotation in Sanity's native document
 * form via `useDocumentPane().onPathOpen`.
 */
export type AnnotationComponent = ComponentType<BlockAnnotationProps>

/**
 * Sanity's critical red, matching the plugin's other inline critical visuals
 * (see the diff spans in RichTableDiff / InlineDiffEditable). Applied to an
 * annotation's text when that annotation carries a validation error, so the
 * broken annotation is pinpointed inline — the per-cell marker badge lives at
 * the rich-table level, not on each cell.
 */
const CRITICAL_COLOR = 'rgb(244, 84, 84)'

const renderBuiltinAnnotation = (
  props: Parameters<RenderAnnotationFunction>[0],
  isInvalid: boolean,
) => {
  const invalidStyle = isInvalid
    ? {color: CRITICAL_COLOR, textDecorationColor: CRITICAL_COLOR}
    : undefined
  if (props.schemaType.name === 'link') {
    return (
      <span
        style={{textDecoration: 'underline', ...invalidStyle}}
        id={`annotation-${props.value._key}`}
        aria-label={props.schemaType.title ?? undefined}
        data-invalid={isInvalid || undefined}
      >
        {props.children}
      </span>
    )
  }

  // Custom annotation: render a styleable span tagged with its name so consumers
  // can target it via CSS (e.g. [data-annotation="footnote"]) instead of it
  // rendering with no affordance.
  return (
    <span
      data-annotation={props.schemaType.name}
      id={`annotation-${props.value._key}`}
      style={invalidStyle}
      data-invalid={isInvalid || undefined}
    >
      {props.children}
    </span>
  )
}

/**
 * Build a `renderAnnotation` that prefers a consumer's custom component (defined
 * via Sanity's native `components.annotation` slot on the block's
 * `marks.annotations`) for the matching annotation name, and otherwise falls
 * back to the built-in presentation above.
 *
 * `invalidKeys` holds the markDef `_key`s of annotations with a validation
 * error; matching annotations get red text (built-ins directly, custom
 * components via an inheriting wrapper) so the specific broken annotation stands
 * out even though per-cell marker badges are surfaced at the table level.
 */
export const createRenderAnnotation = (
  components?: ReadonlyMap<string, AnnotationComponent>,
  invalidKeys?: ReadonlySet<string>,
): RenderAnnotationFunction => {
  return function RenderAnnotation(props) {
    const isInvalid = invalidKeys?.has(props.value._key) ?? false
    const Custom = components?.get(props.schemaType.name)
    if (!Custom) return renderBuiltinAnnotation(props, isInvalid)
    // The consumer's component is typed for Sanity's BlockAnnotationProps, but
    // this editor only supplies the `@portabletext/editor` render props (the
    // annotated text as `children`, plus value/schemaType/selected/focused).
    // Pass those through; the remaining Sanity form props are the consumer's
    // follow-up (default modal via useDocumentPane).
    const rendered = <Custom {...(props as unknown as BlockAnnotationProps)} />
    if (!isInvalid) return rendered
    // Wrap in a red-toned span so the error shows even for custom components that
    // don't set their own colour (text colour inherits into their markup).
    return (
      <span style={{color: CRITICAL_COLOR}} data-invalid>
        {rendered}
      </span>
    )
  }
}

/** Built-in-only `renderAnnotation` (no consumer custom components). */
export const renderAnnotation = createRenderAnnotation()
