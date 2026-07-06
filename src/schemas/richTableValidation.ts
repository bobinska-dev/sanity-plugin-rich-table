import type {CustomValidator, Path, Rule} from 'sanity'

import type {RichTableType} from './richTable.object'

/**
 * Per-instance rich-table constraints. Apply them per field / array member / PT
 * block with the chainable {@link richTableRules} builder.
 *
 * Each violated rule returns a marker on the offending path (the rows /
 * columnHeaders array, or a specific row/column title), so the plugin's inline
 * indicators — the field/block header marker, the empty-table banner and the
 * row/column header tones — light up the right place automatically.
 *
 * @example
 * ```ts
 * defineField({
 *   name: 'myTable',
 *   type: 'richTable',
 *   validation: richTableRules().minRows(2).requireColumnTitles(),
 * })
 * ```
 */
export interface RichTableValidationConfig {
  /** Minimum number of rows the table must have. */
  minRows?: number
  /** Minimum number of columns the table must have. */
  minColumns?: number
  /** Require every row to have a title. Only enforced when row titles are enabled. */
  requireRowTitles?: boolean
  /** Require every column to have a title. Only enforced when column titles are enabled. */
  requireColumnTitles?: boolean
}

const pluralize = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`

const isBlank = (title: string | undefined) => !title || title.trim().length === 0

/**
 * A chainable, rich-table-scoped rule builder. It IS a Sanity `ValidationBuilder`
 * (a `(rule) => rule` function), so it drops straight into a field's
 * `validation` and reads like a native rule chain. Each method returns a fresh
 * builder with the extra constraint, and the terminal builder emits a single
 * `Rule.custom` under the hood.
 *
 * @example
 * ```ts
 * validation: richTableRules().minRows(2).requireColumnTitles()
 * ```
 *
 * @example Compose with native rules via the array form
 * ```ts
 * validation: [richTableRules().minRows(2), (Rule) => Rule.required()]
 * ```
 */
export interface RichTableRuleBuilder {
  (rule: Rule): Rule
  /**
   * Require at least `count` rows.
   *
   * @example
   * ```ts
   * validation: richTableRules().minRows(3)
   * ```
   */
  minRows(count: number): RichTableRuleBuilder
  /**
   * Require at least `count` columns.
   *
   * @example
   * ```ts
   * validation: richTableRules().minColumns(2)
   * ```
   */
  minColumns(count: number): RichTableRuleBuilder
  /**
   * Require every row to have a title. Only enforced while row titles are enabled.
   *
   * @example
   * ```ts
   * validation: richTableRules().requireRowTitles()
   * ```
   */
  requireRowTitles(): RichTableRuleBuilder
  /**
   * Require every column to have a title. Only enforced while column titles are enabled.
   *
   * @example
   * ```ts
   * validation: richTableRules().requireColumnTitles()
   * ```
   */
  requireColumnTitles(): RichTableRuleBuilder
}

/**
 * Chainable, per-instance validation for a `richTable` field, array member or
 * Portable Text block. Assign it straight to `validation` — no `(Rule) =>`
 * wrapper needed. Chain any of {@link RichTableRuleBuilder.minRows | minRows},
 * {@link RichTableRuleBuilder.minColumns | minColumns},
 * {@link RichTableRuleBuilder.requireRowTitles | requireRowTitles} and
 * {@link RichTableRuleBuilder.requireColumnTitles | requireColumnTitles}. Each
 * violation surfaces inline on the offending cell / header / field marker.
 *
 * @param config - starting constraints (usually omitted; set them via the chain)
 *
 * @example On a field
 * ```ts
 * defineField({
 *   name: 'myTable',
 *   type: 'richTable',
 *   validation: richTableRules().minRows(2).requireColumnTitles(),
 * })
 * ```
 *
 * @example On a Portable Text block
 * ```ts
 * defineArrayMember({
 *   name: 'richTableBlock',
 *   type: 'richTableBlock',
 *   validation: richTableRules().minColumns(2).requireRowTitles(),
 * })
 * ```
 *
 * @example Combined with a native rule (array form)
 * ```ts
 * validation: [richTableRules().minRows(1), (Rule) => Rule.required()]
 * ```
 */
export function richTableRules(config: RichTableValidationConfig = {}): RichTableRuleBuilder {
  const builder = ((rule: Rule) => rule.custom(richTableValidator(config))) as RichTableRuleBuilder
  builder.minRows = (count) => richTableRules({...config, minRows: count})
  builder.minColumns = (count) => richTableRules({...config, minColumns: count})
  builder.requireRowTitles = () => richTableRules({...config, requireRowTitles: true})
  builder.requireColumnTitles = () => richTableRules({...config, requireColumnTitles: true})
  return builder
}

/**
 * Builds a Sanity `CustomValidator` enforcing the given rich-table constraints.
 * The lower-level building block behind {@link richTableRules}; use it directly
 * when composing inside your own `Rule.custom`. Returns `true` when valid, or an
 * array of `{message, path}` errors targeting the offending rows / columns.
 *
 * @param config - the constraints to enforce
 *
 * @example Drop into a plain `Rule.custom`
 * ```ts
 * validation: (Rule) => Rule.custom(richTableValidator({minRows: 2}))
 * ```
 *
 * @example Alongside your own checks
 * ```ts
 * validation: (Rule) =>
 *   Rule.custom((table, context) => {
 *     const builtIn = richTableValidator({minRows: 2})(table, context)
 *     if (builtIn !== true) return builtIn
 *     // ...your own checks, return true | string | ValidationError[]
 *     return true
 *   })
 * ```
 */
export function richTableValidator(
  config: RichTableValidationConfig,
): CustomValidator<RichTableType | undefined> {
  return (value) => {
    const rows = value?.rows ?? []
    const columns = value?.columnHeaders ?? []
    const errors: {message: string; path: Path}[] = []

    if (typeof config.minRows === 'number' && rows.length < config.minRows) {
      errors.push({
        message: `The table must have at least ${pluralize(config.minRows, 'row')}.`,
        path: ['rows'],
      })
    }

    if (typeof config.minColumns === 'number' && columns.length < config.minColumns) {
      errors.push({
        message: `The table must have at least ${pluralize(config.minColumns, 'column')}.`,
        path: ['columnHeaders'],
      })
    }

    // Titles are optional features (the `hasColumnTitles` / `hasRowTitles`
    // toggles), so only require them when they're actually enabled.
    if (config.requireColumnTitles && value?.hasColumnTitles) {
      columns.forEach((column) => {
        if (isBlank(column?.title)) {
          errors.push({
            message: 'Column title is required.',
            path: ['columnHeaders', {_key: column._key}, 'title'],
          })
        }
      })
    }

    if (config.requireRowTitles && value?.hasRowTitles) {
      rows.forEach((row) => {
        if (isBlank(row?.title)) {
          errors.push({
            message: 'Row title is required.',
            path: ['rows', {_key: row._key}, 'title'],
          })
        }
      })
    }

    return errors.length > 0 ? errors : true
  }
}
