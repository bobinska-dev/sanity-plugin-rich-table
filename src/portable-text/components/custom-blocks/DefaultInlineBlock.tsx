import type {ObjectSchemaType} from '@sanity/types'
import type {ComponentType} from 'react'
import type {BlockProps} from 'sanity'

/**
 * Default inline-object renderer, used when a consumer sets no
 * `components.tableInlineBlock` on the inline object. Renders a compact chip with
 * the object's title (or type name) so inline objects — including native types
 * like references — read meaningfully in a cell instead of the editor's raw
 * `[type: key]` fallback. Devs override it per type via `components.tableInlineBlock`.
 *
 * The `renderChild` wrapper already makes this a void node (user-select:none +
 * contentEditable=false); this component only supplies the visual.
 */
const DefaultInlineBlock: ComponentType<BlockProps> = (props) => {
  // The editor supplies a stripped inline-object schema type (name + optional
  // title); a richer preview/icon would need the Sanity schema, so fall back to
  // the title, then the type name.
  const schemaType = props.schemaType as unknown as ObjectSchemaType
  const title = (schemaType.title as string | undefined) ?? schemaType.name

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0 0.35em',
        borderRadius: '3px',
        backgroundColor: 'var(--card-badge-default-bg-color, #e3e4e8)',
        color: 'var(--card-badge-default-fg-color, inherit)',
        fontSize: '0.9em',
        lineHeight: 1.5,
        verticalAlign: 'baseline',
      }}
    >
      {title}
    </span>
  )
}

export default DefaultInlineBlock
