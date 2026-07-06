import type {ComponentType} from 'react'
import type {BlockAnnotationProps} from 'sanity'

/**
 * Custom render component for the `footnote` annotation — wired onto the
 * annotation in `customPT` via Sanity's native
 * `components: {annotation: FootnoteAnnotation}`. Renders the annotated text with
 * a superscript marker; the note text is surfaced as a tooltip. Inline, so it
 * must render `props.children`.
 */
const FootnoteAnnotation: ComponentType<BlockAnnotationProps> = (props) => {
  const {text} = props.value as {text?: string}
  return (
    <span
      id={`annotation-${props.value._key}`}
      data-annotation="footnote"
      title={text}
      style={{borderBottom: '1px dotted currentColor'}}
    >
      {props.children}
      <sup style={{color: 'var(--card-focus-ring-color)', fontWeight: 600}}>†</sup>
    </span>
  )
}

export default FootnoteAnnotation
