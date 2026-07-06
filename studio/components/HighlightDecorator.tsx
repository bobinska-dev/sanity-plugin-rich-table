import type {ComponentType} from 'react'
import type {BlockDecoratorProps} from 'sanity'

/**
 * Custom render component for the `highlight` decorator — wired onto the
 * decorator in `customPT` via Sanity's native
 * `{value: 'highlight', component: HighlightDecorator}`. A standard Sanity
 * block-decorator component (`BlockDecoratorProps`). A decorator is inline, so
 * it renders a `<mark>` (not a block element) and must render `props.children`.
 */
const HighlightDecorator: ComponentType<BlockDecoratorProps> = (props) => (
  <mark
    data-decorator="highlight"
    style={{
      backgroundColor: 'var(--card-badge-caution-bg-color, #fff2b2)',
      color: 'inherit',
      padding: '0 0.15em',
      borderRadius: '2px',
    }}
  >
    {props.children}
  </mark>
)

export default HighlightDecorator
