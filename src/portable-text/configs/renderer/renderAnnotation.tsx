import {RenderAnnotationFunction} from '@portabletext/editor'

export const renderAnnotation: RenderAnnotationFunction = (props) => {
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
