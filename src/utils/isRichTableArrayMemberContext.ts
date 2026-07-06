import {isIndexSegment, isKeySegment, type Path} from 'sanity'

/**
 * Whether the rich table object input sits at an array-member (or, when combined
 * with `isInPortableText`, a Portable Text block) position — i.e. its own value
 * carries a `_key`/`_type` that a wholesale `set` would strip. When true, the
 * size picker must initialise the table by patching its *fields* through the
 * relative `onChange`, never by replacing the value at an absolute document path
 * (which would drop the item's `_key`/`_type`).
 *
 * The decision is made purely from the input's OWN path: an array item is always
 * addressed by a key or index segment as its FINAL step, at any nesting depth —
 * `pageBuilder[_key].tableContent` (a field, false) vs.
 * `pageBuilder[_key].sections[_key]` (a member, true) — regardless of how many
 * arrays/objects it is buried under (SAPP-3812).
 *
 * We deliberately do NOT walk the schema to resolve the member type. It is both
 * unnecessary (the input already *is* the table at this path) and impossible to
 * do reliably: a `{_key}` segment carries no type information, so an array
 * nested inside another array's item cannot be resolved from the path alone —
 * the previous schema-walk implementation wrongly returned false for such deeply
 * nested members and sent them down the object-field init path that clobbers
 * `_key`/`_type`. The path-segment check has no such blind spot and needs no
 * hardcoded type name, so renamed array members (e.g.
 * `defineArrayMember({name: 'richTableItem', type: 'richTable'})`) work too.
 *
 * Portable Text blocks are excluded here (returns false) because the caller
 * handles them on its own `isInPortableText` branch.
 */
export const isRichTableArrayMemberContext = (params: {
  path: Path
  isInPortableText?: boolean
}): boolean => {
  const {path, isInPortableText} = params

  if (isInPortableText) return false
  if (path.length === 0) return false

  const lastSegment = path[path.length - 1]
  return isKeySegment(lastSegment) || isIndexSegment(lastSegment)
}
