import type {ComponentType} from 'react'
import type {BlockProps} from 'sanity'

/**
 * Custom render component for the inline object — wired onto the inline object in
 * `customPT` via the table-specific `components: {tableInlineBlock: MentionInline}`
 * slot (sibling of a block object's `tableBlock`). Using `tableInlineBlock`
 * instead of the standard `inlineBlock` leaves the native PT input's default
 * inline-object rendering intact, so the edit form still opens on the object.
 * Renders an inline "@label" chip.
 */
const MentionInline: ComponentType<BlockProps> = (props) => {
  const value = props.value as {label?: string; test?: string; title?: string}
  const label = value.label ?? value.test ?? value.title
  return (
    <span
      data-inline-object="mention"
      style={{
        backgroundColor: 'var(--card-badge-primary-bg-color, #e6ebff)',
        color: 'var(--card-badge-primary-fg-color, #1e40af)',
        borderRadius: '3px',
        padding: '0 0.25em',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      @{label || 'mention'}
    </span>
  )
}

export default MentionInline
