import type {EditorSchema} from '@portabletext/editor'
import type {JSX} from 'react'

import {
  BlockObjectIcon,
  BoldIcon,
  CodeIcon,
  DecoratorIcon,
  H1Icon,
  H2Icon,
  H3Icon,
  H4Icon,
  H5Icon,
  H6Icon,
  InlineObjectIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  StrikethroughIcon,
  TextIcon,
  UnderlineIcon,
} from '../icons'

export type CommandMatch = {
  key: string
  label: string
  description: string
  icon: JSX.Element
  keywords: string[]
  action:
    | {type: 'insert.block'; block: {_type: string}}
    | {type: 'insert.inline object'; inlineObject: {name: string}}
    | {type: 'style.toggle'; style: string}
    | {type: 'list item.toggle'; listItem: string}
    | {type: 'decorator.toggle'; decorator: string}
}

// Per-name icon lookups, with a per-kind fallback. The editor's compiled schema
// carries only `{name, title}` (icons are a toolbar-layer concern), so custom
// styles/decorators fall back to a generic icon here — the label still shows the
// consumer's title and the command stays fully usable.
const STYLE_ICONS: Record<string, () => JSX.Element> = {
  normal: TextIcon,
  h1: H1Icon,
  h2: H2Icon,
  h3: H3Icon,
  h4: H4Icon,
  h5: H5Icon,
  h6: H6Icon,
  blockquote: QuoteIcon,
}
const DECORATOR_ICONS: Record<string, () => JSX.Element> = {
  strong: BoldIcon,
  em: ItalicIcon,
  underline: UnderlineIcon,
  'strike-through': StrikethroughIcon,
  code: CodeIcon,
}
const LIST_ICONS: Record<string, () => JSX.Element> = {
  bullet: ListIcon,
  number: ListOrderedIcon,
}

/** Lowercased, de-duplicated keyword tokens from a name + title (+ extras). */
function keywordsFor(name: string, title: string | undefined, ...extra: string[]): string[] {
  const tokens = [name, ...(title ? title.split(/\s+/) : []), ...extra]
    .join(' ')
    .toLowerCase()
    .split(/[\s-]+/)
    .filter(Boolean)
  return Array.from(new Set(tokens))
}

/**
 * Build the full slash-command list from the editor's compiled schema: every
 * style, decorator, list, block object and inline object the cell's Portable
 * Text schema allows. This keeps the picker in lock-step with whatever the
 * consumer configured (custom styles/marks/blocks included) instead of a
 * hand-maintained static list.
 */
export function buildSlashCommands(schema: EditorSchema): CommandMatch[] {
  const styles: CommandMatch[] = schema.styles.map((style) => ({
    key: `style:${style.name}`,
    label: style.title ?? style.name,
    description: 'Text style',
    icon: (STYLE_ICONS[style.name] ?? TextIcon)(),
    keywords: keywordsFor(style.name, style.title, 'style', 'heading'),
    action: {type: 'style.toggle', style: style.name},
  }))

  const decorators: CommandMatch[] = schema.decorators.map((decorator) => ({
    key: `decorator:${decorator.name}`,
    label: decorator.title ?? decorator.name,
    description: 'Text mark',
    icon: (DECORATOR_ICONS[decorator.name] ?? DecoratorIcon)(),
    keywords: keywordsFor(decorator.name, decorator.title, 'mark', 'decorator', 'format'),
    action: {type: 'decorator.toggle', decorator: decorator.name},
  }))

  const lists: CommandMatch[] = schema.lists.map((list) => ({
    key: `list:${list.name}`,
    label: list.title ?? list.name,
    description: 'List',
    icon: (LIST_ICONS[list.name] ?? ListIcon)(),
    keywords: keywordsFor(list.name, list.title, 'list'),
    action: {type: 'list item.toggle', listItem: list.name},
  }))

  const blockObjects: CommandMatch[] = schema.blockObjects.map((object) => ({
    key: `block:${object.name}`,
    label: object.title ?? object.name,
    description: 'Insert block',
    icon: BlockObjectIcon(),
    keywords: keywordsFor(object.name, object.title, 'block', 'insert'),
    action: {type: 'insert.block', block: {_type: object.name}},
  }))

  const inlineObjects: CommandMatch[] = schema.inlineObjects.map((object) => ({
    key: `inline:${object.name}`,
    label: object.title ?? object.name,
    description: 'Insert inline',
    icon: InlineObjectIcon(),
    keywords: keywordsFor(object.name, object.title, 'inline', 'insert'),
    action: {type: 'insert.inline object', inlineObject: {name: object.name}},
  }))

  return [...styles, ...decorators, ...lists, ...blockObjects, ...inlineObjects]
}
