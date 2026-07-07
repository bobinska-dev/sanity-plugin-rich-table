---
name: qa-review-checklist
description: >-
  General-purpose QA review checklist for React, TypeScript, and Sanity
  codebases. Covers systematic review methodology, risk-based prioritisation,
  type safety, React key management, polymorphic reference handling, GROQ
  linting, async error handling, accessibility, security, and field rename
  completeness. Use when reviewing code changes, performing QA audits, checking
  pull requests, or validating refactors.
---

# QA review checklist

## Tier 1 -- Mindset and principles

### Prevention over detection

Review design decisions and data flow before auditing line-by-line code. Ask:
does the architecture make the wrong thing hard to do? If a bug class is
possible, propose a structural fix (type narrowing, shared helper, validation)
rather than just patching the symptom.

### Risk-based prioritisation

Categorise every finding by user impact so the team knows what to fix first:

| Label          | Meaning                                      | Examples                                                                      |
| -------------- | -------------------------------------------- | ----------------------------------------------------------------------------- |
| `[Blocker]`    | Data loss, broken UI, security hole          | Missing error boundary, unhandled mutation failure, XSS vector                |
| `[Should fix]` | Correctness, accessibility, stale references | Wrong document type in pane navigation, duplicate React keys, orphaned JSDoc  |
| `[Suggestion]` | Performance, style, naming                   | Redundant GROQ function, heavy projection in list query, legacy variable name |

### Systematic completeness

Scan changes in layers -- do not skip any:

1. **Schema / types** -- field definitions, validation rules, TypeScript types
2. **Queries** -- GROQ projections, filters, conditional branches
3. **Business logic** -- helpers, context providers, server functions
4. **UI components** -- rendering, key props, a11y
5. **Tests / mocks** -- mock data shape matches new schema
6. **Docs / comments** -- JSDoc, README, inline comments
7. **Migration / seed data** -- data scripts match the new field names

### Empathy for the editor

Surface errors visibly with actionable guidance. In Studio **schema validators**
(outside React), use `console.error('[AppName] ...')` and return a warning
string. In Studio **React components**, use `useToast()` from `@sanity/ui` plus
`console.error` so the editor gets a visible notification and support gets the
stack trace.

### Incremental verification

After each fix, run `tsc --noEmit` for affected workspaces and relevant tests
before moving to the next finding. Do not batch all fixes and hope they compile.

### Document as you go

If a review uncovers a repeatable anti-pattern, propose a Cursor rule or skill
update so the same class of issue is prevented in the future.

---

## Tier 2 -- React / TypeScript / GROQ checklist

### Type safety

- Flag `any` casts -- prefer `unknown` with type guards.
- Flag non-null assertions (`!`) -- prefer optional chaining (`?.`).
- After optional chaining, verify the downstream code handles the `undefined`
  case (e.g. `value?.length` used in a comparison without a fallback).
- Prefer `Extract<Union, { _type: 'x' }>` to narrow discriminated unions over
  manual type casts.
- Use exhaustive `switch` statements on discriminated unions (add a `default:
never` check) so the compiler catches unhandled variants.
- Validate external inputs (API responses, URL params, form data) at the
  boundary before passing into typed code.

### React keys

- Keys must be **stable** and **unique** within the list.
- After merging / concatenating arrays, deduplicate by `_id` (or `_key` for
  inline objects) before rendering. Duplicate keys cause React reconciliation
  bugs and console warnings.
- Use composite keys (`${source}-${id}`) when combining items from
  heterogeneous sources.
- Never use array index as a key if the list is reorderable or filterable.

### Polymorphic references

When a Sanity field uses `to: [{ type: 'A' }, { type: 'B' }]`:

- **Every consumer** (component, GROQ projection, pane navigation) must branch
  on the target document's `_type`.
- Studio field components should resolve the referenced document's `_type`
  (e.g. via a lightweight `*[_id == $ref][0]._type` fetch) and adapt behaviour.
- Hide UI affordances that do not apply to all target types (e.g. a "view
  resources" link when the referenced type has no `resources` field).

### GROQ query hygiene

- List queries should use **lighter projections** than detail queries. Avoid
  resolving nested references, assets, or arrays when only counts or titles are
  needed.
- `coalesce(x, null)` is a no-op -- a missing field already returns `null`.
- Avoid repeated `->` on the same reference; merge into a single dereference.
- Use `defined()` in filters to reduce the search space before expensive
  operations.

See the [high-performance-groq](../high-performance-groq/SKILL.md) skill for
the full performance checklist. For automated enforcement, use the
`@sanity-labs/eslint-plugin` (from the
[sanity-lint](https://github.com/sanity-labs/sanity-lint) suite). Key rules to
watch for in reviews:

| Lint rule                   | Why it matters                                             |
| --------------------------- | ---------------------------------------------------------- |
| `groq-join-in-filter`       | `->` inside a filter is a sub-query per candidate document |
| `groq-unknown-field`        | Typo in a field name (schema-aware)                        |
| `groq-invalid-type-filter`  | `_type` value does not exist in the schema                 |
| `groq-repeated-dereference` | Same reference resolved multiple times                     |
| `groq-deep-pagination`      | Large slice offsets are O(N)                               |
| `groq-large-pages`          | Fetching too many documents in one slice                   |

### Async error handling

Every `client.fetch` or `context.getClient().fetch` needs defensive handling:

- **Schema validators** (outside React): wrap in `try/catch`, `console.error`
  with a `[AppName]` prefix, and return a human-readable warning string.
- **React components**: wrap in `try/catch`, call `useToast().push({ status:
'error', ... })` from `@sanity/ui`, and `console.error`.

### Accessibility

- Use `<button>` for actions and `<a href="...">` for navigation. Never use
  `<a role="button">` without an `href`.
- Icons inside buttons that already have `aria-label` must be marked
  `aria-hidden="true"` to avoid redundant announcements.
- All interactive elements must be keyboard accessible (focusable, operable
  with Enter/Space, visible focus indicator).
- Use semantic HTML (`<nav>`, `<main>`, `<section>`) before reaching for ARIA.
- Colour contrast must meet WCAG AA (4.5:1 for text, 3:1 for large text and
  UI components).
- Focus order must follow a logical reading sequence -- verify after DOM
  reordering or conditional rendering.

### Field rename completeness

When renaming a schema field, verify the rename propagates to **all 8 layers**:

1. Schema definition (`defineField({ name: '...' })`)
2. GROQ queries (projections, filters, `order()`)
3. TypeScript types / interfaces
4. Business logic (helpers, context providers, server functions)
5. UI components (prop access, rendering)
6. Tests and mock data
7. JSDoc / comments / variable names
8. Migration scripts and seed data

Search the codebase for the **old** name after renaming to catch stragglers.

---

## Tier 3 -- Security, performance, and schema hygiene

### Security

- Sanitise any user-supplied content rendered as HTML to prevent XSS. Avoid
  `dangerouslySetInnerHTML` unless the source is trusted (e.g. Portable Text
  rendered through `@portabletext/react`).
- Never log or expose secrets, tokens, or PII in client-side code or error
  messages.
- Audit `target="_blank"` links -- add `rel="noopener noreferrer"` when
  linking to external origins.

### Component design

- Keep components small and single-purpose. If a component accepts more than
  5-6 props, consider whether it should be split or composed.
- Avoid deep prop drilling -- prefer context or composition patterns.
- `useCallback` and `useMemo` should only be used when there is a measured or
  structural need (stable reference for a dependency array, expensive
  computation). Premature memoisation adds complexity without benefit.
- Error boundaries should wrap independently-failing subtrees, not the entire
  app. Verify each boundary renders a meaningful fallback.

### Sanity schema hygiene

The `@sanity-labs/eslint-plugin` also lints schema definitions. Key rules:

| Lint rule                        | Why it matters                                                          |
| -------------------------------- | ----------------------------------------------------------------------- |
| `schema-missing-define-type`     | Schema must use `defineType()` for TypeGen                              |
| `schema-missing-define-field`    | Fields must use `defineField()` for TypeGen                             |
| `schema-reserved-field-name`     | Avoid clashing with `_id`, `_type`, etc.                                |
| `schema-missing-icon`            | Document types without icons are hard to identify in Studio             |
| `schema-missing-slug-source`     | Slug fields without `options.source` frustrate editors                  |
| `schema-presentation-field-name` | Field names like `heroSection` or `leftColumn` couple content to layout |

### Migration safety

- Migration scripts must be idempotent -- running them twice on the same
  document should produce the same result. Handle the case where both old and
  new field names exist.
- Always dry-run migrations (`sanity migration run <name> --dry`) and review
  the diff before applying.
- Clean up orphaned old fields rather than silently skipping them.
