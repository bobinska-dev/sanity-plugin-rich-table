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
 * Resolve the SchemaDefinition for the PTE from either a resolved Sanity
 * ArraySchemaType or from the built-in defaults.
 */
export function resolveSchemaDefinition(
  schemaType?: ArraySchemaType<PortableTextBlock>,
): SchemaDefinition {
  if (!schemaType) {
    return defaultSchemaDefinition
  }

  // If the schemaType looks like a resolved Sanity schema (has `of` with block members
  // that have `marks`/`styles`/`lists`), convert it
  const block = findBlockMember(schemaType)
  if (block && (block.marks || block.styles || block.lists)) {
    return sanitySchemaToDefinition(schemaType)
  }

  // Unresolved definition (e.g. raw defineType result) — use defaults
  return defaultSchemaDefinition
}
