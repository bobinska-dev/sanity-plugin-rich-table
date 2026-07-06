import type {ComponentType} from 'react'
import type {BlockAnnotationProps} from 'sanity'

/**
 * Custom render component for the `link` annotation — wired onto the annotation
 * in `customPT` via Sanity's native `components: {annotation: LinkAnnotation}`.
 * Annotations are inline, so this renders a link-styled `<span>` (not a real
 * navigating `<a>`, since we're inside the editor) and must render `props.children`.
 */
const LinkAnnotation: ComponentType<BlockAnnotationProps> = (props) => {
  const {href} = props.value as {href?: string}
  return (
    <span
      id={`annotation-${props.value._key}`}
      title={href}
      style={{
        color: 'var(--card-link-color, #2276fc)',
        textDecoration: 'underline',
        textUnderlineOffset: '2px',
      }}
    >
      {props.children}
    </span>
  )
}

export default LinkAnnotation
