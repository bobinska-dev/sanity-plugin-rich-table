import {link} from '@portabletext/keyboard-shortcuts'
import type {ExtendAnnotationSchemaType} from '@portabletext/toolbar'
import {LinkIcon} from '@sanity/icons'

import type {SchemaMarkLike} from './schemaToolbarTypes'

/**
 * Creates an `extendAnnotation` for `useToolbarSchema`. The built-in `link`
 * annotation gets its icon/shortcut/default href; any custom annotation gets the
 * `icon`/`title` from its consumer schema type if defined. Consumer config wins.
 *
 * @param schemaAnnotations - the consumer block schema's `marks.annotations`
 */
export function createExtendAnnotation(
  schemaAnnotations?: ReadonlyArray<SchemaMarkLike>,
): ExtendAnnotationSchemaType {
  return (annotation) => {
    const fromSchema = schemaAnnotations?.find((a) => (a.name ?? a.value) === annotation.name)

    if (annotation.name === 'link') {
      return {
        ...annotation,
        icon: fromSchema?.icon ?? LinkIcon,
        defaultValues: {
          href: 'https://example.com',
        },
        shortcut: link,
        ...(fromSchema?.title !== undefined && {title: fromSchema.title}),
      }
    }

    return {
      ...annotation,
      ...(fromSchema?.icon && {icon: fromSchema.icon}),
      ...(fromSchema?.title !== undefined && {title: fromSchema.title}),
    }
  }
}

/** Built-in-only `extendAnnotation` (no consumer schema). */
export const extendAnnotation = createExtendAnnotation()
