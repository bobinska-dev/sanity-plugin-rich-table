import type {ExtendListSchemaType} from '@portabletext/toolbar'
import type {ComponentType} from 'react'

import {ListIcon, ListOrderedIcon} from '../icons'
import type {SchemaMarkLike} from './schemaToolbarTypes'

// Built-in icons for the standard list types. Used as a fallback when the
// consumer's schema doesn't supply its own icon for these names.
const BUILTIN_LISTS: Record<string, {icon: ComponentType}> = {
  bullet: {icon: ListIcon},
  number: {icon: ListOrderedIcon},
}

/**
 * Creates an `extendList` for `useToolbarSchema`. Consumer-schema config
 * (`icon`/`title` on the block's `lists`) takes precedence; the built-ins fill
 * in the standard lists; a custom list keeps its own schema title/icon.
 *
 * @param schemaLists - the consumer block schema's `lists`
 */
export function createExtendList(
  schemaLists?: ReadonlyArray<SchemaMarkLike>,
): ExtendListSchemaType {
  return (list) => {
    const fromSchema = schemaLists?.find((l) => (l.value ?? l.name) === list.name)
    const icon = fromSchema?.icon ?? BUILTIN_LISTS[list.name]?.icon
    return {
      ...list,
      ...(fromSchema?.title !== undefined && {title: fromSchema.title}),
      ...(icon && {icon}),
    }
  }
}

/** Built-in-only `extendList` (no consumer schema). */
export const extendList = createExtendList()
