import type {ComponentType} from 'react'

/**
 * Minimal shape of a decorator / style / list / annotation entry read off a
 * consumer's compiled Sanity block schema. Decorators, styles and lists identify
 * themselves by `value`; annotations by `name`. All can carry an `icon` and
 * `title`, which the toolbar `extend*` factories merge onto the toolbar schema
 * so consumer-defined marks show up with their own presentation.
 */
export interface SchemaMarkLike {
  value?: string
  name?: string
  title?: string
  icon?: ComponentType
}
