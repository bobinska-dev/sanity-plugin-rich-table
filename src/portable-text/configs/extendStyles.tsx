import type {ExtendStyleSchemaType} from '@portabletext/toolbar'
import type {ComponentType} from 'react'

import {H1Icon, H2Icon, H3Icon, H4Icon, H5Icon, H6Icon, QuoteIcon, TextIcon} from '../icons'
import type {SchemaMarkLike} from './schemaToolbarTypes'

// Built-in presentation for the standard block styles. Used as a fallback when
// the consumer's schema doesn't supply its own icon/title for these names.
const BUILTIN_STYLES: Record<string, {icon: ComponentType; title: string}> = {
  normal: {icon: TextIcon, title: 'Normal'},
  h1: {icon: H1Icon, title: 'Heading 1'},
  h2: {icon: H2Icon, title: 'Heading 2'},
  h3: {icon: H3Icon, title: 'Heading 3'},
  h4: {icon: H4Icon, title: 'Heading 4'},
  h5: {icon: H5Icon, title: 'Heading 5'},
  h6: {icon: H6Icon, title: 'Heading 6'},
  blockquote: {icon: QuoteIcon, title: 'Quote'},
}

/**
 * Creates an `extendStyle` for `useToolbarSchema`. Consumer-schema config
 * (`icon`/`title` on the block's `styles`) takes precedence; the built-ins fill
 * in the standard styles; a custom style keeps its own schema title and gets its
 * schema icon if one was defined.
 *
 * @param schemaStyles - the consumer block schema's `styles`
 */
export function createExtendStyles(
  schemaStyles?: ReadonlyArray<SchemaMarkLike>,
): ExtendStyleSchemaType {
  return (style) => {
    const fromSchema = schemaStyles?.find((s) => (s.value ?? s.name) === style.name)
    const builtin = BUILTIN_STYLES[style.name]
    const icon = fromSchema?.icon ?? builtin?.icon
    const title = fromSchema?.title ?? builtin?.title ?? style.title
    return {
      ...style,
      ...(title !== undefined && {title}),
      ...(icon && {icon}),
    }
  }
}

/** Built-in-only `extendStyle` (no consumer schema). */
const extendStyle = createExtendStyles()
export default extendStyle
