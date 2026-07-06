import type {ComponentType} from 'react'
import type {BlockProps} from 'sanity'

/**
 * Custom render component for the `mention` inline object — wired onto the inline
 * object in `customPT` via Sanity's native `components: {inlineBlock: MentionInline}`.
 * Renders an inline "@label" chip. Inline objects need no table-specific sibling
 * (only block objects use `tableBlock`), so this single component renders in a
 * cell exactly as it would in normal Portable Text.
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
