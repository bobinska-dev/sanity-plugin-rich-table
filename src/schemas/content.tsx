import {defineArrayMember, defineType} from 'sanity'

type ArrayMember = ReturnType<typeof defineArrayMember>

/**
 * Sanity schema type for table cell content.
 *
 * This registers the `content` array type in Sanity's schema system. Sanity
 * fills in default decorators, styles, and lists during its own compilation
 * pipeline, but the raw object exported here does NOT contain them.
 *
 * The standalone PTE in {@link ../portable-text/ContentPortableTextEditor.tsx}
 * uses {@link ../portable-text/resolveSchemaDefinition.ts | defaultSchemaDefinition}
 * instead, which provides the same defaults in the format expected by
 * `@portabletext/editor` v6.
 */
const defaultBlockMember = defineArrayMember({
  type: 'block',
  options: {
    oneLine: false,
  },
})

const defaultContent = defineType({
  name: 'content',
  title: 'Rich table content',
  type: 'array',
  of: [defaultBlockMember],
})

export default defaultContent

/**
 * Create the `content` schema type, optionally appending extra array members
 * to the default block member. The returned type always keeps `name: 'content'`
 * so that the cell schema reference (`type: 'content'`) continues to resolve.
 *
 * @param additionalMembers - Extra array members to include alongside the
 *   default `block` type (e.g. image, custom objects).
 * @param blockOverrides - Optional partial overrides for the default block
 *   member (e.g. custom styles, marks, decorators). Merged on top of the
 *   default block definition.
 */
export function createContentType(
  additionalMembers?: ArrayMember[],
  blockOverrides?: Record<string, unknown>,
): ReturnType<typeof defineType> {
  const blockMember = blockOverrides
    ? defineArrayMember({...defaultBlockMember, ...blockOverrides, type: 'block'})
    : defaultBlockMember

  const members = additionalMembers ? [blockMember, ...additionalMembers] : [blockMember]

  if (!additionalMembers && !blockOverrides) return defaultContent

  return defineType({
    name: 'content',
    title: 'Rich table content',
    type: 'array',
    of: members,
  })
}
