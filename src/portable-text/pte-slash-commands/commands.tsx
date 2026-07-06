import type {EditorSchema} from '@portabletext/editor'
import type {ComponentType, JSX} from 'react'

import type {ExtractedBlockConfig} from '../configs/extractBlockConfig'
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

// Per-name icon fallbacks, used only when the schema defines no icon of its own
// for that style/decorator/list. Custom entries fall back to a generic per-kind
// icon — but a schema-supplied icon (see `resolveIcon`) always wins so the
// picker matches the toolbar.
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

/** Index a config group's schema-supplied icons by name. */
function iconIndex(
  entries?: ReadonlyArray<{name: string; icon?: ComponentType}>,
): Map<string, ComponentType> {
  const index = new Map<string, ComponentType>()
  entries?.forEach((entry) => {
    if (entry.icon) index.set(entry.name, entry.icon)
  })
  return index
}

/**
 * Prefer the schema's own icon component (so the picker matches the toolbar);
 * otherwise use the per-name / per-kind fallback.
 */
function resolveIcon(custom: ComponentType | undefined, fallback: () => JSX.Element): JSX.Element {
  if (custom) {
    const Icon = custom
    return <Icon />
  }
  return fallback()
}

/**
 * Build the full slash-command list from the editor's compiled schema — every
 * style, decorator, list, block object and inline object the cell's Portable
 * Text schema allows (custom entries included). The editor schema defines which
 * operations are valid; the optional `config` (from `extractBlockConfig`, the
 * same source the toolbar uses) supplies each entry's schema-defined icon so the
 * picker and toolbar stay visually aligned.
 */
export function buildSlashCommands(
  schema: EditorSchema,
  config?: ExtractedBlockConfig,
): CommandMatch[] {
  const styleIcons = iconIndex(config?.styles)
  const decoratorIcons = iconIndex(config?.decorators)
  const listIcons = iconIndex(config?.lists)
  const blockIcons = iconIndex(config?.blockObjects)
  const inlineIcons = iconIndex(config?.inlineObjects)

  const styles: CommandMatch[] = schema.styles.map((style) => ({
    key: `style:${style.name}`,
    label: style.title ?? style.name,
    description: 'Text style',
    icon: resolveIcon(styleIcons.get(style.name), STYLE_ICONS[style.name] ?? TextIcon),
    keywords: keywordsFor(style.name, style.title, 'style', 'heading'),
    action: {type: 'style.toggle', style: style.name},
  }))

  const decorators: CommandMatch[] = schema.decorators.map((decorator) => ({
    key: `decorator:${decorator.name}`,
    label: decorator.title ?? decorator.name,
    description: 'Text mark',
    icon: resolveIcon(
      decoratorIcons.get(decorator.name),
      DECORATOR_ICONS[decorator.name] ?? DecoratorIcon,
    ),
    keywords: keywordsFor(decorator.name, decorator.title, 'mark', 'decorator', 'format'),
    action: {type: 'decorator.toggle', decorator: decorator.name},
  }))

  const lists: CommandMatch[] = schema.lists.map((list) => ({
    key: `list:${list.name}`,
    label: list.title ?? list.name,
    description: 'List',
    icon: resolveIcon(listIcons.get(list.name), LIST_ICONS[list.name] ?? ListIcon),
    keywords: keywordsFor(list.name, list.title, 'list'),
    action: {type: 'list item.toggle', listItem: list.name},
  }))

  const blockObjects: CommandMatch[] = schema.blockObjects.map((object) => ({
    key: `block:${object.name}`,
    label: object.title ?? object.name,
    description: 'Insert block',
    icon: resolveIcon(blockIcons.get(object.name), BlockObjectIcon),
    keywords: keywordsFor(object.name, object.title, 'block', 'insert'),
    action: {type: 'insert.block', block: {_type: object.name}},
  }))

  const inlineObjects: CommandMatch[] = schema.inlineObjects.map((object) => ({
    key: `inline:${object.name}`,
    label: object.title ?? object.name,
    description: 'Insert inline',
    icon: resolveIcon(inlineIcons.get(object.name), InlineObjectIcon),
    keywords: keywordsFor(object.name, object.title, 'inline', 'insert'),
    action: {type: 'insert.inline object', inlineObject: {name: object.name}},
  }))

  return [...styles, ...decorators, ...lists, ...blockObjects, ...inlineObjects]
}
