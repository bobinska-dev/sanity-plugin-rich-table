import type {ComponentType} from 'react'
import type {ArraySchemaType, PortableTextBlock} from 'sanity'

/**
 * A decorator / style / list entry extracted from a compiled Sanity block.
 *
 * `component` is the consumer's optional custom render component, defined on the
 * style/decorator in the schema (`{title, value, component}`). Sanity preserves
 * it through compilation even though its public type omits it.
 */
export interface ExtractedMark {
  name: string
  title?: string
  icon?: ComponentType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component?: ComponentType<any>
}

/** The coarse field types the editor's SchemaDefinition understands. */
export type SchemaFieldType = 'string' | 'number' | 'boolean' | 'array' | 'object'

/** An annotation / block-object / inline-object entry (an object type). */
export interface ExtractedType {
  name: string
  title?: string
  icon?: ComponentType
  // Custom render component from the annotation's `components.annotation` slot.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component?: ComponentType<any>
  fields: Array<{name: string; title?: string; type: SchemaFieldType}>
}

/**
 * Collapse any Sanity field type name to the coarse set the editor
 * SchemaDefinition accepts. Everything object-like (reference/image/file/slug/…)
 * becomes `object`; string-like scalars become `string`.
 */
function coerceFieldType(type: unknown): SchemaFieldType {
  const name = typeof type === 'string' ? type : ((type as Loose)?.name as string | undefined)
  if (name === 'number') return 'number'
  if (name === 'boolean') return 'boolean'
  if (name === 'array') return 'array'
  if (
    name === 'string' ||
    name === 'text' ||
    name === 'url' ||
    name === 'date' ||
    name === 'datetime'
  ) {
    return 'string'
  }
  return 'object'
}

export interface ExtractedBlockConfig {
  decorators: ExtractedMark[]
  styles: ExtractedMark[]
  lists: ExtractedMark[]
  annotations: ExtractedType[]
  blockObjects: ExtractedType[]
  inlineObjects: ExtractedType[]
}

// The compiled schema is loosely typed; traverse it with a permissive shape.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = Record<string, any>

/** Unwrap to the array's own members (`of`), tolerating a `{type: {of}}` wrapper. */
function getMembers(schemaType?: ArraySchemaType<PortableTextBlock>): Loose[] | undefined {
  const s = schemaType as Loose | undefined
  const of = s?.of?.length ? s.of : s?.type?.of
  return Array.isArray(of) ? (of as Loose[]) : undefined
}

function getField(block: Loose | undefined, name: string): Loose | undefined {
  return Array.isArray(block?.fields)
    ? (block.fields as Loose[]).find((f) => f.name === name)
    : undefined
}

/**
 * The text block member of a PT array. In the compiled schema it is the member
 * with a `children` field (or, defensively, one named `block`).
 */
function findTextBlock(members?: Loose[]): Loose | undefined {
  return members?.find((m) => m.name === 'block' || getField(m, 'children') !== undefined)
}

/** The span member inside the block's `children` array (holds decorators + annotations). */
function getSpan(block: Loose | undefined): Loose | undefined {
  const of = getField(block, 'children')?.type?.of
  return Array.isArray(of)
    ? (of as Loose[]).find((m) => Array.isArray(m.decorators) || m.name === 'span')
    : undefined
}

/** Read a `style`/`list` field's enum (`type.options.list`) as `{name,title}` marks. */
function marksFromListField(field: Loose | undefined): ExtractedMark[] {
  const list = field?.type?.options?.list
  if (!Array.isArray(list)) return []
  return (list as Array<string | Loose>).map((item) =>
    typeof item === 'string'
      ? {name: item}
      : {name: item.value, title: item.title, icon: item.icon, component: item.component},
  )
}

function fieldsOf(objectType: Loose | undefined): ExtractedType['fields'] {
  const fields = objectType?.fields
  if (!Array.isArray(fields)) return []
  return (fields as Loose[]).map((f) => ({
    name: f.name as string,
    title: f.title as string | undefined,
    type: coerceFieldType(f.type),
  }))
}

function toObjectType(member: Loose): ExtractedType {
  return {
    name: member.name as string,
    title: member.title as string | undefined,
    icon: member.icon as ComponentType | undefined,
    fields: fieldsOf(member),
  }
}

const isTextBlockMember = (m: Loose): boolean =>
  m.name === 'block' || getField(m, 'children') !== undefined

/**
 * Extract the decorators, styles, lists, annotations and block/inline objects
 * from a compiled Sanity Portable Text array schema.
 *
 * The compiled shape is deeply nested and NOT the definition shape:
 * - styles/lists live on the block's `style`/`list` fields (`type.options.list`)
 * - decorators/annotations live on the span inside the block's `children` field
 *   (and carry their `icon`)
 * - block objects are the array's non-text-block members; inline objects are the
 *   `children` array's non-span members.
 *
 * Returns `undefined` when no text block is present (e.g. an unresolved
 * definition), so callers can fall back to defaults.
 */
export function extractBlockConfig(
  schemaType?: ArraySchemaType<PortableTextBlock>,
): ExtractedBlockConfig | undefined {
  const members = getMembers(schemaType)
  const block = findTextBlock(members)
  if (!block) return undefined

  const span = getSpan(block)
  const decorators: ExtractedMark[] = Array.isArray(span?.decorators)
    ? (span!.decorators as Loose[]).map((d) => ({
        name: d.value as string,
        title: d.title as string | undefined,
        icon: d.icon as ComponentType | undefined,
        component: d.component as ExtractedMark['component'],
      }))
    : []
  // Annotations are object types; their custom render component lives on Sanity's
  // native `components.annotation` slot (an object's whole `components` map
  // survives compilation).
  const annotations: ExtractedType[] = Array.isArray(span?.annotations)
    ? (span!.annotations as Loose[]).map((a) => ({
        ...toObjectType(a),
        component: (a.components as Loose | undefined)?.annotation as ExtractedType['component'],
      }))
    : []

  const styles = marksFromListField(getField(block, 'style'))
  // The compiled list field is named `listItem` (not `list`); fall back to
  // `list` defensively in case a future schema version renames it.
  const lists = marksFromListField(getField(block, 'listItem') ?? getField(block, 'list'))

  const blockObjects = (members ?? []).filter((m) => !isTextBlockMember(m)).map(toObjectType)

  const childrenOf = getField(block, 'children')?.type?.of
  const inlineObjects = Array.isArray(childrenOf)
    ? (childrenOf as Loose[])
        .filter((m) => m.name !== 'span' && !Array.isArray(m.decorators))
        .map((m) => ({
          ...toObjectType(m),
          // Inline objects use their single standard `components.inlineBlock` slot
          // (no table-specific sibling — only block objects need `tableBlock`).
          component: (m.components as Loose | undefined)?.inlineBlock as ExtractedType['component'],
        }))
    : []

  return {decorators, styles, lists, annotations, blockObjects, inlineObjects}
}
