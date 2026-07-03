import {
  bold,
  createKeyboardShortcut,
  italic,
  type KeyboardShortcut,
  strikeThrough,
  underline,
} from '@portabletext/keyboard-shortcuts'
import type {ExtendDecoratorSchemaType} from '@portabletext/toolbar'
import type {ComponentType} from 'react'

import {BoldIcon, CodeIcon, ItalicIcon, StrikethroughIcon, UnderlineIcon} from '../icons'
import type {SchemaMarkLike} from './schemaToolbarTypes'

const codeShortcut = createKeyboardShortcut({
  default: [{key: 'E', alt: false, ctrl: false, meta: true, shift: false}],
  apple: [
    {key: 'E', alt: false, ctrl: false, meta: true, shift: false},
    {key: 'C', alt: false, ctrl: false, meta: true, shift: true},
  ],
})

type BuiltinDecorator = {icon: ComponentType; title: string; shortcut?: KeyboardShortcut}

// Built-in presentation for the standard decorators. Used as a fallback when the
// consumer's schema doesn't supply its own icon/title for these names.
const BUILTIN_DECORATORS: Record<string, BuiltinDecorator> = {
  strong: {icon: () => <BoldIcon />, title: 'Bold', shortcut: bold},
  em: {icon: () => <ItalicIcon />, title: 'Italic', shortcut: italic},
  code: {icon: () => <CodeIcon />, title: 'Inline Code', shortcut: codeShortcut},
  underline: {icon: () => <UnderlineIcon />, title: 'Underline', shortcut: underline},
  'strike-through': {
    icon: () => <StrikethroughIcon />,
    title: 'Strikethrough',
    shortcut: strikeThrough,
  },
}

/**
 * Creates an `extendDecorator` for `useToolbarSchema`. Consumer-schema config
 * (the `icon`/`title` on the block's `marks.decorators`) takes precedence; the
 * built-ins fill in the standard decorators; a custom decorator keeps its own
 * schema title and gets its schema icon if one was defined.
 *
 * @param schemaDecorators - the consumer block schema's `marks.decorators`
 */
export function createExtendDecorators(
  schemaDecorators?: ReadonlyArray<SchemaMarkLike>,
): ExtendDecoratorSchemaType {
  return (decorator) => {
    const fromSchema = schemaDecorators?.find((d) => (d.value ?? d.name) === decorator.name)
    const builtin = BUILTIN_DECORATORS[decorator.name]
    const icon = fromSchema?.icon ?? builtin?.icon
    const title = fromSchema?.title ?? builtin?.title ?? decorator.title
    const shortcut = builtin?.shortcut
    return {
      ...decorator,
      ...(title !== undefined && {title}),
      ...(icon && {icon}),
      ...(shortcut && {shortcut}),
    }
  }
}

/** Built-in-only `extendDecorator` (no consumer schema). */
const extendDecorator = createExtendDecorators()
export default extendDecorator
