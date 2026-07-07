---
name: sanity-schema-lint-suppressions
description: >-
  How to recognise, fix, and suppress false-positive warnings from the
  @sanity-labs/eslint-plugin schema rules — especially the name-based
  `sanity/schema-heading-level-in-schema` heuristic. Covers where the disable
  comment must go (above the `defineType` call, not the field), why TypeScript
  changes cannot silence these rules, the `Rule.custom<T>` generic constraint,
  and which Portable Text patterns are NOT affected. Use when an ESLint warning
  from `@sanity-labs/eslint-plugin` looks wrong, when a Sanity schema field is
  flagged for "appears to store heading levels", when adding a field whose name
  ends in `Level` / `h1`–`h6`, or when wiring `Rule.custom` validators on
  enum-typed string fields.
---

# Suppressing false-positive schema lints from @sanity-labs/eslint-plugin

The `@sanity-labs/eslint-plugin` package ships several **name-based** schema
lint rules that pattern-match on field names rather than inspecting the
TypeScript types or option values. They surface as warnings on the
`defineType(...)` call.

This skill is about working with them correctly when they fire on a legitimate
domain field. The flagship example is `sanity/schema-heading-level-in-schema`,
but the same suppression mechanics apply to every rule shipped by
`@sanity-labs/schema-lint`.

## Quick recognition

| Signal                                                                               | What it means                                                                          |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Warning text starts `Field "..." appears to store heading levels`                    | The name-based half of `schema-heading-level-in-schema` matched.                       |
| Warning text starts `Field "..." contains heading level options (h1, h2, etc.)`      | The `field.options.list` half matched — value-based, not name-based.                   |
| Warning is anchored on `defineType({` (the type-level line), not the offending field | Confirms the lint comes from a `@sanity-labs/schema-lint` rule via the ESLint adapter. |

## The heading-level heuristic

`sanity/schema-heading-level-in-schema` runs two checks per field:

1. **Field name** matches any of:
   - `/^(heading|header)Level$/i`
   - `/^h[1-6]$/i`
   - `/Level$/` (this one is the false-positive magnet — it matches `skillLevel`, `accessLevel`, `confidenceLevel`, etc.)
2. **Field options list** contains any of `h1`, `h2`, `h3`, `h4`, `h5`, `h6` as a value.

The name check ignores the field's TS type, the `description`, and the option
values. **No type narrowing satisfies the rule.**

The value check inspects `field.options.list` only. It does **not** look at
`block.styles`, so the standard Portable Text definition

```ts
defineArrayMember({
  type: 'block',
  styles: [
    { title: 'Heading 2', value: 'h2' },
    { title: 'Heading 3', value: 'h3' },
  ],
})
```

is fine and never triggers the warning.

## Where the disable comment must go

The ESLint adapter reports the finding on the entire `defineType(...)`
`CallExpression`, not on the field's AST node. The relevant source lives in
`@sanity-labs/eslint-plugin/dist/index.cjs`:

```ts
context.report({
  node: eslintNode, // the whole defineType(...) call
  ...
})
```

Consequences:

- `// eslint-disable-next-line sanity/schema-heading-level-in-schema` placed
  next to the `defineField({ name: 'skillLevel', ... })` block has **no
  effect** — the warning targets a different line.
- The disable comment must sit directly above the `defineType(...)` (or the
  `export default defineType(...)`) call.

The same placement rule applies to every `sanity/schema-*` rule in this
plugin, because all of them share the `createSchemaESLintRule` adapter that
reports on the `defineType` node.

## Canonical fix

For a domain enum that legitimately ends in `Level` (or otherwise trips the
name regex), apply this pattern:

1. **Type the enum** in a shared constants module so consumers see intent:

   ```typescript
   /**
    * Participant proficiency tiers used by `planTemplate.skillLevel` and
    * `learningPath.skillLevel`. Domain enum — not an HTML heading level.
    */
   export const SKILL_LEVELS = [
     { title: 'Beginner', value: 'beginner' },
     { title: 'Intermediate', value: 'intermediate' },
     { title: 'Advanced', value: 'advanced' },
   ] as const satisfies ReadonlyArray<{ title: string; value: string }>

   /** Union of valid `skillLevel` values. */
   export type SkillLevel = (typeof SKILL_LEVELS)[number]['value']
   ```

2. **Disable the rule on the `defineType` call** with a comment that
   documents the domain meaning:

   ```typescript
   // eslint-disable-next-line sanity/schema-heading-level-in-schema -- `skillLevel` is a domain enum (learner proficiency tier; see SkillLevel in ../constants), not an HTML heading level. The lint is a name-based heuristic that flags any field ending in "Level".
   export default defineType({
     name: 'planTemplate',
     // ...
     fields: [
       defineField({
         name: 'skillLevel',
         type: 'string',
         description:
           'Expected participant proficiency tier (beginner / intermediate / advanced). Domain enum — not an HTML heading level.',
         options: { list: [...SKILL_LEVELS] },
         validation: (Rule) =>
           Rule.custom<SkillLevel>((value) => {
             if (value === undefined) return true
             return SKILL_LEVELS.some((s) => s.value === value)
               ? true
               : `Must be one of: ${SKILL_LEVELS.map((s) => s.value).join(', ')}.`
           }),
       }),
     ],
   })
   ```

3. **Mirror the disable** on every schema file that exposes the same field
   name (e.g. both `planTemplate.ts` and `learningPath.ts` for `skillLevel`).

## `Rule.custom<T>` generic constraint

`Rule.custom<T>(fn)` requires `T extends string` (and similar primitive
constraints for other rule types). A nullable union therefore fails to
compile:

```typescript
// BAD — TS2344: Type 'string | undefined' does not satisfy the constraint 'string'.
Rule.custom<SkillLevel | undefined>((value) => { ... })

// GOOD — narrow to the literal string union; handle undefined inside the body.
Rule.custom<SkillLevel>((value) => {
  if (value === undefined) return true
  return SKILL_LEVELS.some((s) => s.value === value) ? true : 'Invalid value.'
})
```

The validator receives `value` as `T | undefined` at runtime regardless of the
generic — Sanity calls it on empty fields too.

## When to rename instead of suppress

Suppression is the right default because it's local, documented, and avoids a
content migration. **Rename the field instead** when:

- The field is new (no documents yet) — change the schema before you have
  data to migrate.
- The "Level" suffix is genuinely accidental (e.g. `confidenceLevel` could
  become `confidence`).
- More than two or three schemas would each need their own disable comment —
  at that scale, fixing the name removes recurring noise.

Renaming a field with existing data requires a `defineMigration` script under
the studio's `migrations/` directory and the standard CLI flow:

```bash
pnpm --filter <studio> exec sanity migrations run <id> --project <projectId> --dataset <dataset>
pnpm --filter <studio> exec sanity migrations run <id> --project <projectId> --dataset <dataset> --no-dry-run
```

See the `sanity-content-migrations` skill for the full migration template.

## Audit checklist when adding a new `*Level` / `h1`–`h6` field

- [ ] Confirm the field is a domain enum, not actually a heading level. If
      it stores `h1`/`h2`/etc., rewrite the frontend to compute the heading
      from document structure instead.
- [ ] Add a typed enum + `SkillLevel`-style union in the relevant
      `constants.ts` module.
- [ ] Use `Rule.custom<EnumType>` (not `Rule.custom<EnumType | undefined>`).
- [ ] Add the `eslint-disable-next-line sanity/schema-heading-level-in-schema`
      directive directly above `defineType(...)` with a `--` justification.
- [ ] Update the field `description` to call out that this is a domain enum
      and not an HTML heading level — it documents intent for the next
      reviewer.
- [ ] Run `pnpm exec eslint <changed schema files>` to confirm zero
      `schema-heading-level-in-schema` findings before committing.

## Sibling rules that share the same suppression mechanics

Every rule from `@sanity-labs/schema-lint` is reported on the `defineType`
node, so the disable-above-`defineType` placement applies to all of them:

- `sanity/schema-presentation-field-name`
- `sanity/schema-reserved-field-name`
- `sanity/schema-missing-description`
- `sanity/schema-missing-icon`
- `sanity/schema-missing-required-validation`
- `sanity/schema-missing-slug-source`
- `sanity/schema-missing-title`
- `sanity/schema-array-missing-constraints`
- `sanity/schema-boolean-instead-of-list`
- `sanity/schema-unnecessary-reference`

If suppressing one of these, follow the same pattern: comment above
`defineType(...)`, include a `--` justification, prefer fixing the underlying
issue when feasible.
