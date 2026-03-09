import type {SchemaDefinition} from '@portabletext/editor'
import type {ArraySchemaType, PortableTextBlock} from 'sanity'

/**
 * Standard Portable Text defaults matching what Sanity provides for a
 * bare `{type: 'block'}` member with no customisation.
 */
export const defaultSchemaDefinition: SchemaDefinition = {
  decorators: [
    {name: 'strong', title: 'Bold'},
    {name: 'em', title: 'Italic'},
    {name: 'underline', title: 'Underline'},
    {name: 'code', title: 'Code'},
    {name: 'strike-through', title: 'Strikethrough'},
  ],
  styles: [
    {name: 'normal', title: 'Normal'},
    {name: 'h1', title: 'Heading 1'},
    {name: 'h2', title: 'Heading 2'},
    {name: 'h3', title: 'Heading 3'},
    {name: 'h4', title: 'Heading 4'},
    {name: 'h5', title: 'Heading 5'},
    {name: 'h6', title: 'Heading 6'},
    {name: 'blockquote', title: 'Blockquote'},
  ],
  lists: [
    {name: 'bullet', title: 'Bullet'},
    {name: 'number', title: 'Number'},
  ],
  annotations: [
    {name: 'link', title: 'Link', fields: [{name: 'href', title: 'URL', type: 'string'}]},
  ],
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SanityBlockMember = Record<string, any>

/**
 * Attempt to find the block member inside a Sanity ArraySchemaType.
 * Resolved Sanity schemas store it in `of[]` with a `type` or `jsonType`
 * that identifies it as a block.
 */
function findBlockMember(
  schemaType: ArraySchemaType<PortableTextBlock>,
): SanityBlockMember | undefined {
  if (!Array.isArray(schemaType.of)) return undefined
  return schemaType.of.find((member) => {
    const m = member as SanityBlockMember
    return m.name === 'block' || m.jsonType === 'object' || m.type?.name === 'block'
  })
}

/**
 * Convert a Sanity resolved ArraySchemaType into a SchemaDefinition
 * that `@portabletext/editor` v6 understands.
 *
 * Sanity stores PTE config as:
 * - `blockMember.styles` → `{title, value}[]`
 * - `blockMember.lists` → `{title, value}[]`
 * - `blockMember.marks.decorators` → `{title, value}[]`
 * - `blockMember.marks.annotations` → annotation schema types
 *
 * SchemaDefinition expects `{name, title?}[]` for each.
 */
export function sanitySchemaToDefinition(
  schemaType: ArraySchemaType<PortableTextBlock>,
): SchemaDefinition {
  const block = findBlockMember(schemaType)

  if (!block) {
    return defaultSchemaDefinition
  }

  const decorators =
    block.marks?.decorators?.map((d: {value: string; title?: string}) => ({
      name: d.value,
      title: d.title,
    })) ?? defaultSchemaDefinition.decorators

  const styles =
    block.styles?.map((s: {value: string; title?: string}) => ({
      name: s.value,
      title: s.title,
    })) ?? defaultSchemaDefinition.styles

  const lists =
    block.lists?.map((l: {value: string; title?: string}) => ({
      name: l.value,
      title: l.title,
    })) ?? defaultSchemaDefinition.lists

  const annotations =
    block.marks?.annotations?.map((a: SanityBlockMember) => ({
      name: a.name as string,
      title: a.title as string | undefined,
      fields:
        a.fields?.map((f: SanityBlockMember) => ({
          name: f.name as string,
          title: f.title as string | undefined,
          type: (f.type?.name ?? f.type ?? 'string') as string,
        })) ?? [],
    })) ?? defaultSchemaDefinition.annotations

  const blockObjects =
    block.of?.map((obj: SanityBlockMember) => ({
      name: obj.name as string,
      title: obj.title as string | undefined,
      fields:
        obj.fields?.map((f: SanityBlockMember) => ({
          name: f.name as string,
          title: f.title as string | undefined,
          type: (f.type?.name ?? f.type ?? 'string') as string,
        })) ?? [],
    })) ?? []

  const nonBlockMembers = schemaType.of?.filter((member) => {
    const m = member as SanityBlockMember
    return m.name !== 'block' && m.jsonType !== 'object' && m.type?.name !== 'block'
  })

  const inlineObjects =
    nonBlockMembers?.map((obj: SanityBlockMember) => ({
      name: obj.name as string,
      title: obj.title as string | undefined,
      fields:
        obj.fields?.map((f: SanityBlockMember) => ({
          name: f.name as string,
          title: f.title as string | undefined,
          type: (f.type?.name ?? f.type ?? 'string') as string,
        })) ?? [],
    })) ?? []

  return {
    decorators,
    styles,
    lists,
    annotations,
    blockObjects,
    inlineObjects,
  }
}

/**
 * Extract a SchemaDefinition from an ArraySchemaType whose block member is a
 * fully compiled `BlockSchemaType` — the shape you get when using `useSchema()`.
 * In this case `ArraySchemaType.of` contains `ObjectSchemaType` instances, so the
 * block configuration lives inside `block.fields` as typed field objects rather
 * than as direct `marks`/`styles`/`lists` properties.
 *
 * Field mapping:
 * - `style` field → `type.options.list` → styles
 * - `listItem` field → `type.options.list` → lists
 * - `children` field → span member's `decorators` → decorators
 * - `markDefs` field → `type.of` → annotations
 */
function sanitySchemaToDefinitionFromFields(
  schemaType: ArraySchemaType<PortableTextBlock>,
): SchemaDefinition {
  const block = findBlockMember(schemaType)
  if (!block || !Array.isArray(block.fields)) return defaultSchemaDefinition

  const styleField = block.fields.find((f: SanityBlockMember) => f.name === 'style')
  const listItemField = block.fields.find((f: SanityBlockMember) => f.name === 'listItem')
  const childrenField = block.fields.find((f: SanityBlockMember) => f.name === 'children')
  const markDefsField = block.fields.find((f: SanityBlockMember) => f.name === 'markDefs')

  const styles =
    styleField?.type?.options?.list?.map((s: {value: string; title?: string}) => ({
      name: s.value,
      title: s.title,
    })) ?? defaultSchemaDefinition.styles

  const lists =
    listItemField?.type?.options?.list?.map((l: {value: string; title?: string}) => ({
      name: l.value,
      title: l.title,
    })) ?? defaultSchemaDefinition.lists

  // Decorators live directly on the span member (spanMember.decorators),
  // not under spanMember.marks. Entries use {value, title} in this resolved format.
  const spanMember = childrenField?.type?.of?.find(
    (m: SanityBlockMember) => m.name === 'span' || m.type?.name === 'span',
  )
  const decorators =
    spanMember?.decorators?.map((d: {value?: string; name?: string; title?: string}) => ({
      name: (d.name ?? d.value) as string,
      title: d.title,
    })) ?? defaultSchemaDefinition.decorators

  // Annotations live in the markDefs field's array members
  const annotations =
    markDefsField?.type?.of?.map((a: SanityBlockMember) => ({
      name: a.name as string,
      title: a.title as string | undefined,
      fields:
        a.fields?.map((f: SanityBlockMember) => ({
          name: f.name as string,
          // f.title may be undefined in compiled schemas; the title is on f.type.title.
          title: (f.title ?? f.type?.title) as string | undefined,
          type: (f.type?.name ?? f.type ?? 'string') as string,
        })) ?? [],
    })) ?? defaultSchemaDefinition.annotations

  // Inline objects are non-block members of the outer array
  const nonBlockMembers = schemaType.of?.filter((member) => {
    const m = member as SanityBlockMember
    return m.name !== 'block' && m.type?.name !== 'block'
  })

  const inlineObjects =
    nonBlockMembers?.map((obj: SanityBlockMember) => ({
      name: obj.name as string,
      title: obj.title as string | undefined,
      fields:
        obj.fields?.map((f: SanityBlockMember) => ({
          name: f.name as string,
          title: (f.title ?? f.type?.title) as string | undefined,
          type: (f.type?.name ?? f.type ?? 'string') as string,
        })) ?? [],
    })) ?? []

  return {decorators, styles, lists, annotations, inlineObjects}
}

/**
 * Resolve the SchemaDefinition for the PTE from a Sanity ArraySchemaType.
 *
 * Dispatches based on the shape of the block member inside the array:
 * - When `ArraySchemaType.of` contains a fully compiled `BlockSchemaType`
 *   (e.g. from `useSchema()`), the block configuration is inside `block.fields`
 *   → handled by `sanitySchemaToDefinitionFromFields`.
 * - When the block member retains definition-level `marks`/`styles`/`lists`
 *   directly → handled by `sanitySchemaToDefinition`.
 * - Otherwise (unresolved / raw schema) → returns `defaultSchemaDefinition`.
 */
export function resolveSchemaDefinition(
  schemaType?: ArraySchemaType<PortableTextBlock>,
): SchemaDefinition {
  if (!schemaType) {
    return defaultSchemaDefinition
  }

  const block = findBlockMember(schemaType)
  if (!block) return defaultSchemaDefinition

  // If the schemaType looks like a resolved Sanity schema (has `of` with block members
  // that have `marks`/`styles`/`lists`), convert it
  if (block.marks || block.styles || block.lists) {
    return sanitySchemaToDefinition(schemaType)
  }

  if (
    Array.isArray(block.fields) &&
    block.fields.some((f: SanityBlockMember) =>
      ['style', 'listItem', 'children', 'markDefs'].includes(f.name),
    )
  ) {
    return sanitySchemaToDefinitionFromFields(schemaType)
  }

  // Unresolved definition (e.g. raw defineType result) — use defaults
  return defaultSchemaDefinition
}
