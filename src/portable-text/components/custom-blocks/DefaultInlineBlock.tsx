import type {ObjectSchemaType, PreviewValue} from '@sanity/types'
import type {ComponentType} from 'react'
import type {BlockProps} from 'sanity'

const ICON_SIZE = 12

/**
 * Default inline-object renderer, used when a consumer sets no
 * `components.tableInlineBlock` on the inline object. Mirrors Sanity's native
 * inline-object pill: the schema icon plus a preview title derived from the value
 * (schema `preview`, then the first string field, then the type title/name), so
 * inline objects — including native types like references — read meaningfully in a
 * cell instead of the editor's raw `[type: key]`. Devs override it per type via
 * `components.tableInlineBlock`.
 *
 * The `renderChild` wrapper already makes this a void node (user-select:none +
 * contentEditable=false); this component only supplies the visual.
 */
const DefaultInlineBlock: ComponentType<BlockProps> = (props) => {
  const schemaType = props.schemaType as unknown as ObjectSchemaType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value = props.value as Record<string, any>
  const title = getInlineTitle(schemaType, value)

  return (
    <span
      data-inline-preview={schemaType.name}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5em',
        padding: '0 0.45em',
        borderRadius: '3px',
        backgroundColor: 'var(--card-badge-default-bg-color, #e3e4e8)',
        color: 'var(--card-badge-default-fg-color, inherit)',
        fontSize: '0.9em',
        lineHeight: 1.6,
        verticalAlign: 'middle',
      }}
    >
      {schemaType.icon && (
        // @ts-expect-error - `icon` can be a React component but the schema types don't reflect that
        <schemaType.icon style={{width: ICON_SIZE, height: ICON_SIZE, flexShrink: 0}} />
      )}
      {title}
    </span>
  )
}

/**
 * Derive a display title the way Sanity's default preview does: the schema
 * `preview` (select + optional prepare), else the first non-meta string field on
 * the value, else the type's title or name.
 */
function getInlineTitle(
  schemaType: ObjectSchemaType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: Record<string, any>,
): string {
  const select = schemaType.preview?.select
  if (select) {
    const selection = Object.fromEntries(
      Object.entries(select).map(([key, path]) => [key, value?.[path as string]]),
    )
    const prepared = (schemaType.preview?.prepare?.(selection) ?? selection) as PreviewValue
    if (prepared?.title) return String(prepared.title)
  }
  const firstString = Object.entries(value ?? {}).find(
    ([key, fieldValue]) =>
      !key.startsWith('_') && typeof fieldValue === 'string' && fieldValue.trim() !== '',
  )?.[1]
  if (typeof firstString === 'string') return firstString
  return (schemaType.title as string | undefined) ?? schemaType.name
}

export default DefaultInlineBlock
