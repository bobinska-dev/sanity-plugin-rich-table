import {RenderAnnotationFunction} from '@portabletext/editor'

export const renderAnnotation: RenderAnnotationFunction = (props) => {
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
