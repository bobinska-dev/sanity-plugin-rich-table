---
name: sanity-content-migrations
description: >-
  Sanity content migration patterns using the CLI and defineMigration API from
  sanity/migrate. Covers field renames, array restructuring, type conversions,
  Portable Text transforms, async migrations, content releases, dry-run testing,
  validation, and common pitfalls. Use when writing, running, or debugging
  content migrations, renaming schema fields, restructuring document data, or
  running sanity migrations CLI commands.
---

# Sanity content migrations

## When to use

Use the `sanity migrations` CLI whenever a schema change requires existing
documents to be updated. Common triggers:

- Renaming a field (`item` → `template`)
- Changing a field from single value to array (or vice versa)
- Converting inline objects to references
- Backfilling new required fields
- Restructuring nested data (e.g. moving fields into/out of objects)
- Converting between string ↔ Portable Text
- Migrating into a content release instead of patching live data
- Deleting documents by type or criteria

## File structure

Migrations live in a `migrations/` folder alongside `sanity.cli.ts`. Two
layouts are supported:

```
migrations/
├── simple-rename.ts                     # standalone file
├── complex-migration/                   # folder with index
│   └── index.ts
```

Use the folder layout when the migration needs helper files. The migration ID
is the filename (without `.ts`) or folder name.

Supported extensions: `.ts`, `.js`, `.mjs`, `.cjs`.

## Scaffold and discover

```bash
# scaffold a new migration (prompts for title and template)
npx sanity migration create "Rename field X to Y"

# list all discovered migrations
npx sanity migrations list
```

## Core API

Import everything from `sanity/migrate`:

```typescript
import {
  defineMigration,
  at, // target a path
  set, // overwrite value
  setIfMissing, // set only if absent
  unset, // remove value
  patch, // patch a specific doc by ID
  del, // delete a document
  createIfNotExists,
  createOrReplace,
  append, // append to array
  prepend, // prepend to array
  replace, // replace array item by _key
} from 'sanity/migrate'
```

### defineMigration options

```typescript
export default defineMigration({
  title: 'Human-readable description',
  documentTypes: ['plan', 'planTemplate'],  // optional scope
  filter: 'defined(todos)',                 // optional GROQ filter (no joins)

  migrate: {
    // Choose ONE or more handlers:
    document(doc, context) { ... },
    node(node, path, context) { ... },
    object(node, path, context) { ... },
    array(node, path, context) { ... },
    string(node, path, context) { ... },
    number(node, path, context) { ... },
    boolean(node, path, context) { ... },
    null(node, path, context) { ... },
  },
})
```

- `documentTypes` scopes to specific types. Omit to target all documents.
- `filter` adds a GROQ predicate (simple filters only, no joins or pipes).
- Handlers can be `async` and receive a `context` with `context.client`.
- Array keys are auto-generated — you do not need to set `_key` manually.

**Choosing a handler:** Use `document` when the logic depends on top-level
fields or requires cross-field decisions. Use `object` when you need to
patch all objects of a specific `_type` (e.g. `crossDatasetReference`,
`link`) regardless of where they appear in the document tree — this avoids
manually enumerating every possible field path per document type.

### Async generator pattern (`*migrate`)

For large datasets where loading all documents into memory is impractical,
use the top-level async generator form:

```typescript
import { defineMigration, patch, at, setIfMissing } from 'sanity/migrate'

export default defineMigration({
  title: 'Add title field with default value',
  documentTypes: ['post'],
  async *migrate(documents, context) {
    for await (const document of documents()) {
      yield patch(document._id, [at('title', setIfMissing('Default title'))])
    }
  },
})
```

This streams documents one-by-one instead of buffering them.

## Common patterns

### Rename a field

```typescript
import { defineMigration, at, setIfMissing, unset } from 'sanity/migrate'

export default defineMigration({
  title: 'Rename "oldName" to "newName"',
  documentTypes: ['myType'],
  migrate: {
    document(doc) {
      if (!('oldName' in doc)) return
      return [at('newName', setIfMissing(doc.oldName)), at('oldName', unset())]
    },
  },
})
```

### Rename nested fields inside arrays

When the field to rename is inside array items (e.g. `todos[].item` →
`todos[].template`), rebuild the full array and `set` it:

```typescript
import { at, defineMigration, set } from 'sanity/migrate'

export default defineMigration({
  title: 'Rename todos[].item → todos[].template',
  documentTypes: ['plan'],
  filter: 'defined(todos)',

  migrate: {
    document(doc) {
      const todos = doc.todos as any[] | undefined
      if (!todos?.length) return

      let changed = false
      const updated = todos.map((todo) => {
        const patched = { ...todo }
        if ('item' in patched && !('template' in patched)) {
          patched.template = patched.item
          delete patched.item
          changed = true
        }
        return patched
      })

      if (!changed) return
      return at('todos', set(updated))
    },
  },
})
```

### Convert a single value to an array

```typescript
import { at, defineMigration, setIfMissing, append, unset } from 'sanity/migrate'

export default defineMigration({
  title: 'Convert category ref to categories[]',
  documentTypes: ['product'],
  filter: 'defined(category) && !defined(categories)',
  migrate: {
    document(doc) {
      return [
        at('categories', setIfMissing([])),
        at('categories', append(doc.category)),
        at('category', unset()),
      ]
    },
  },
})
```

### Backfill a default value

```typescript
import { at, defineMigration, setIfMissing } from 'sanity/migrate'

export default defineMigration({
  title: 'Backfill publishedAt with _createdAt',
  documentTypes: ['post'],
  migrate: {
    document(doc) {
      return at('publishedAt', setIfMissing(doc._createdAt))
    },
  },
})
```

### Convert string to Portable Text

```typescript
import { pathsAreEqual, stringToPath } from 'sanity'
import { defineMigration, set } from 'sanity/migrate'

const targetPath = stringToPath('description')

export default defineMigration({
  title: 'Convert description from string to Portable Text',
  migrate: {
    string(node, path) {
      if (pathsAreEqual(path, targetPath)) {
        return set([
          {
            style: 'normal',
            _type: 'block',
            children: [{ _type: 'span', marks: [], text: node }],
            markDefs: [],
          },
        ])
      }
    },
  },
})
```

### Async migration with client fetch

```typescript
import { at, defineMigration, set } from 'sanity/migrate'

export default defineMigration({
  title: 'Resolve and embed author name',
  documentTypes: ['post'],
  migrate: {
    async document(doc, context) {
      if (!doc.author?._ref) return
      const name = await context.client.fetch(`*[_id == $id][0].name`, { id: doc.author._ref })
      if (!name) return
      return at('authorName', set(name))
    },
  },
})
```

### Patch all objects of a specific `_type` with the `object` handler

The `object` handler visits every nested object in every document. Use it
when you need to patch all objects of a given `_type` regardless of where
they appear — top-level fields, inside arrays, or deeply nested. This is
much simpler than enumerating every possible field path per document type.

```typescript
import { at, defineMigration, set } from 'sanity/migrate'

export default defineMigration({
  title: 'Update CDR _dataset from production to staging',
  migrate: {
    object(node, path) {
      if (node._type !== 'crossDatasetReference') return
      if (node._dataset !== 'production') return
      return at(path, set({ ...node, _dataset: 'staging' }))
    },
  },
})
```

The handler receives the current `path` as an array of segments. Return an
`at(path, set(...))` operation to replace the object — the framework handles
the rest. No `documentTypes` or `filter` needed since the handler already
skips non-matching objects by returning `undefined`.

**Important:** For reference-like types (`crossDatasetReference`, regular
references), the API does not allow patching sub-paths within them. You must
replace the entire object with `at(path, set({...node, field: newValue}))`
instead of `at([...path, 'field'], set(newValue))`, which will fail with
"Key not allowed in ref".

This pattern works for any typed inline object (`crossDatasetReference`,
`link`, `annotation`, etc.) at any nesting depth.

### Find and update deeply nested objects

Use `extractWithPath` from `@sanity/mutator` when you need document-level
context while updating nested objects:

```typescript
import { extractWithPath } from '@sanity/mutator'
import { at, defineMigration, set } from 'sanity/migrate'

export default defineMigration({
  title: 'Update all nested link objects',
  migrate: {
    document(doc) {
      const matches = extractWithPath('..[_type=="link"]', doc)
      if (matches.length === 0) return
      return matches.map(({ path, value }) => at(path, set({ ...value, tracking: true })))
    },
  },
})
```

The `..` operator is JSONMatch recursive descent syntax — it matches objects
at any depth.

### Migrate into a content release

Write version documents into a release instead of patching live data:

```typescript
import { defineMigration, createOrReplace } from 'sanity/migrate'
const RELEASE_ID = 'release-id'

export default defineMigration({
  title: 'Migrate posts into content release',
  documentTypes: ['post'],
  filter: `!(_id in path('versions.**'))`,
  migrate: {
    document(doc) {
      return [
        createOrReplace({
          _type: 'post',
          _id: `versions.${RELEASE_ID}.${doc._id}`,
          title: doc.title,
          content: doc.body,
        }),
      ]
    },
  },
})
```

### Delete documents by type

```typescript
import { defineMigration, del } from 'sanity/migrate'

export default defineMigration({
  title: 'Delete obsolete pages',
  documentTypes: ['legacyPage'],
  migrate: {
    document(doc) {
      return del(doc._id)
    },
  },
})
```

Documents with incoming strong references cannot be deleted this way.

## Validating documents before/after migration

Use `sanity documents validate` to check schema conformance:

```bash
# check all documents against current schema
npx sanity documents validate

# output as NDJSON for scripted analysis
npx sanity documents validate -y --format ndjson > validations.ndjson

# validate against a local export file
npx sanity documents validate --file production.tar.gz
```

Run this before writing a migration to understand what needs fixing,
and after to confirm the migration resolved the issues.

## Running migrations

Order flags `--project` → `--dataset` → `--no-dry-run` so invocations are consistent and the target + write-intent are obvious at a glance.

```bash
# dry-run (default) — shows patches without writing, uses sanity.cli.ts defaults
npx sanity migrations run <id>

# dry-run against a specific project + dataset
npx sanity migrations run <id> --project <projectId> --dataset staging

# execute against a specific project + dataset (both flags required together)
npx sanity migrations run <id> --project <projectId> --dataset staging --no-dry-run

# skip confirmation prompt
npx sanity migrations run <id> --project <projectId> --dataset staging --no-dry-run --no-confirm

# dry-run from a local export (faster for large datasets)
npx sanity migrations run <id> --from-export production.tar.gz

# control concurrency (1–10, default 6)
npx sanity migrations run <id> --project <projectId> --dataset staging --no-dry-run --concurrency 3
```

Always run a dry-run first and review the patch output before executing.

**`--dataset` and `--project` must be paired.** Passing one without the other exits with `Error: If either --dataset or --project is provided, both must be provided`. To target a non-default dataset, supply both flags; to use the values from `sanity.cli.ts`, omit both.

## Workflow checklist

1. **Create** the migration file in `migrations/`
2. **Verify** it appears in `npx sanity migrations list`
3. **Dry-run** with `npx sanity migrations run <id>` and review patches
4. **Back up** the dataset (`sanity datasets export` or `sanity datasets copy`)
5. **Execute** with `--no-dry-run`
6. **Verify** documents in Studio or with a GROQ query

## Gotchas

- **Immutable fields**: `_id`, `_type`, `_createdAt` cannot be patched. To
  change these, export → modify NDJSON → re-import.
- **No joins in filter**: The `filter` option supports simple GROQ predicates
  only (no `*[...]` sub-queries, no `->` dereferencing).
- **Draft documents**: Migrations run on both published and draft documents
  by default. Use `filter: '!(_id in path("drafts.**"))'` to skip drafts,
  or `filter: '!(_id in path("versions.**"))'` to skip release versions.
- **Rate limits**: Migrations share API rate limits. Lower `--concurrency`
  if you hit 429 errors.
- **Defensive checks**: Use `setIfMissing` over `set` when the target field
  might already have the correct value (e.g. from a partial earlier run).
  Check `!('newField' in doc)` before renaming to make migrations idempotent.
- **Array keys**: The migration tooling runs with `autoGenerateArrayKeys`
  enabled. You do not need to set `_key` on new array items.
- **Old migrations**: Do not modify completed migration scripts that were
  already run against production. Create a new migration instead.
- **Strong references**: Documents with incoming strong references cannot be
  deleted via `del()`. Remove or reassign references first.

For additional cheat sheet patterns (deduplication, heading shifts, i18n,
reference sorting), see the
[content migration cheat sheet](https://www.sanity.io/docs/content-lake/content-migration-cheatsheet).
