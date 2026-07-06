import {RenderAnnotationFunction} from '@portabletext/editor'
import type {ComponentType} from 'react'
import type {BlockAnnotationProps} from 'sanity'

/**
 * A consumer-supplied custom annotation component, keyed by annotation name.
 * Wired via Sanity's native `components.annotation` slot and typed against
 * Sanity's {@link BlockAnnotationProps}.
 *
 * NOTE: this editor is built on `@portabletext/editor`, which supplies the
 * annotated text (as `children`) but not Sanity's full form-interaction props
 * (`onOpen`/`renderInput`/`textElement`/…). Those are passed through as-is and
 * are not yet wired to a default editing modal — see the `useDocumentPane`
 * follow-up in AnnotationDialog.
 */
export type AnnotationComponent = ComponentType<BlockAnnotationProps>

const renderBuiltinAnnotation: RenderAnnotationFunction = (props) => {
  if (props.schemaType.name === 'link') {
    return (
      <span
        style={{textDecoration: 'underline'}}
        id={`annotation-${props.value._key}`}
        aria-label={props.schemaType.title ?? undefined}
      >
        {props.children}
      </span>
    )
  }

  // Custom annotation: render a styleable span tagged with its name so consumers
  // can target it via CSS (e.g. [data-annotation="footnote"]) instead of it
  // rendering with no affordance.
  return (
    <span data-annotation={props.schemaType.name} id={`annotation-${props.value._key}`}>
      {props.children}
    </span>
  )
}

/**
 * Build a `renderAnnotation` that prefers a consumer's custom component (defined
 * via Sanity's native `components.annotation` slot on the block's
 * `marks.annotations`) for the matching annotation name, and otherwise falls
 * back to the built-in presentation above.
 */
export const createRenderAnnotation = (
  components?: ReadonlyMap<string, AnnotationComponent>,
): RenderAnnotationFunction => {
  return function RenderAnnotation(props) {
    const Custom = components?.get(props.schemaType.name)
    if (!Custom) return renderBuiltinAnnotation(props)
    // The consumer's component is typed for Sanity's BlockAnnotationProps, but
    // this editor only supplies the `@portabletext/editor` render props (the
    // annotated text as `children`, plus value/schemaType/selected/focused).
    // Pass those through; the remaining Sanity form props are the consumer's
    // follow-up (default modal via useDocumentPane).
    return <Custom {...(props as unknown as BlockAnnotationProps)} />
  }
}

/** Built-in-only `renderAnnotation` (no consumer custom components). */
export const renderAnnotation = createRenderAnnotation()
