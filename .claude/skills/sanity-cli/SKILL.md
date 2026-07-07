---
name: sanity-cli
description: >-
  Sanity CLI commands for schema change management: migrations (create, list,
  run), document validation, schema validation and deployment, dataset
  export/import, and GROQ queries. Use when running sanity CLI commands,
  validating documents or schemas, exporting or importing datasets, querying
  documents from the terminal, or orchestrating migration workflows.
---

# Sanity CLI

CLI commands for schema change management, content validation, and dataset
operations. Complements the `sanity-content-migrations` skill which covers
migration _code_ patterns (`defineMigration`, `at`, `set`, etc.).

**Always use `pnpm dlx sanity@latest` (never `npx`) in this repo.**

## Quick reference

| Command                        | Purpose                                       |
| ------------------------------ | --------------------------------------------- |
| `sanity migration create`      | Scaffold a new migration file                 |
| `sanity migrations list`       | List discovered migrations                    |
| `sanity migrations run <id>`   | Dry-run (default) or execute a migration      |
| `sanity documents validate`    | Check all documents against the schema        |
| `sanity documents query`       | Run a GROQ query from the terminal            |
| `sanity documents get <id>`    | Fetch a single document by ID                 |
| `sanity documents create`      | Create document(s) from JSON                  |
| `sanity documents delete <id>` | Delete document(s) by ID                      |
| `sanity schemas validate`      | Check schema configuration for errors         |
| `sanity schemas deploy`        | Deploy schema documents to workspace datasets |
| `sanity schemas extract`       | Extract JSON representation of the schema     |
| `sanity schemas list`          | List schemas in the current dataset           |
| `sanity datasets export`       | Export a dataset (backup)                     |
| `sanity datasets import`       | Import an NDJSON or tarball                   |
| `sanity datasets copy`         | Copy one dataset to another                   |

## Migrations CLI

### Create a migration

```bash
sanity migration create
sanity migration create "Rename field X to Y"
```

Prompts for title, target document types, and a starter template. Creates a
file in `migrations/` alongside `sanity.cli.ts`.

### List migrations

```bash
sanity migrations list
```

Shows all migration files discovered in the `migrations/` folder.

### Run a migration

Order flags `--project` → `--dataset` → `--no-dry-run` so invocations are consistent and the target + write-intent are obvious at a glance.

```bash
# dry-run (default) — shows patches without writing, uses sanity.cli.ts defaults
sanity migrations run <id>

# dry-run against a specific project + dataset
sanity migrations run <id> --project <projectId> --dataset staging

# execute against a specific project + dataset (both flags required together)
sanity migrations run <id> --project <projectId> --dataset staging --no-dry-run

# skip confirmation prompt
sanity migrations run <id> --project <projectId> --dataset staging --no-dry-run --no-confirm

# dry-run from a local export (faster for large datasets)
sanity migrations run <id> --from-export production.tar.gz

# control concurrency (1–10, default 6)
sanity migrations run <id> --project <projectId> --dataset staging --no-dry-run --concurrency 3
```

| Flag                   | Default       | Description                                       |
| ---------------------- | ------------- | ------------------------------------------------- |
| `--dry-run`            | `true`        | Show patches only. Use `--no-dry-run` to execute. |
| `--dataset <name>`     | CLI config    | Target dataset. Must be paired with `--project`.  |
| `--project <id>`       | CLI config    | Target project. Must be paired with `--dataset`.  |
| `--from-export <file>` | —             | Local `.tar.gz` source (dry-run only)             |
| `--concurrency <1-10>` | `6`           | Parallel mutation requests                        |
| `--confirm`            | `true`        | Prompt before running. `--no-confirm` to skip.    |
| `--progress`           | `true`        | Show progress. `--no-progress` to hide.           |
| `--api-version <ver>`  | `v2024-01-29` | API version                                       |

Always dry-run first and review the patch output before executing.

**Gotcha:** `--dataset` and `--project` must be supplied together. Omitting one while passing the other fails with `Error: If either --dataset or --project is provided, both must be provided`. Either pass both, or pass neither and let the CLI fall back to `sanity.cli.ts` defaults.

## Documents CLI

### Validate documents

Check all documents against the current schema:

```bash
# pretty-printed report
sanity documents validate

# machine-readable NDJSON (pipe to file for large datasets)
sanity documents validate -y --format ndjson > validations.ndjson

# validate a local export file
sanity documents validate --file production.tar.gz

# only show errors (skip warnings)
sanity documents validate --level error

# target a specific workspace
sanity documents validate --workspace default
```

| Flag                                  | Description                                          |
| ------------------------------------- | ---------------------------------------------------- |
| `--workspace <name>`                  | Studio workspace to use                              |
| `--dataset <name>`                    | Override dataset                                     |
| `--file <path>`                       | Validate `.ndjson` or `.tar.gz` instead of live data |
| `--format <value>`                    | Output format: `pretty` (default), `json`, `ndjson`  |
| `--level <value>`                     | Minimum level: `error`, `warning` (default), `info`  |
| `-y, --yes`                           | Skip confirmation prompt                             |
| `--max-custom-validation-concurrency` | Concurrent custom validators                         |
| `--max-fetch-concurrency`             | Concurrent `client.fetch` requests                   |

Each validation entry includes `documentId`, `documentType`, `revision`,
`intentUrl` (Studio link), `markers[]` with `path`, `level`, and `message`,
and a root `level` reflecting the most severe marker.

**Tip:** Pipe NDJSON output to [GROQ CLI](https://github.com/sanity-io/groq-cli)
for filtering:

```bash
cat validations.ndjson | groq -n "*[level == 'error'].intentUrl"
```

### Query documents

```bash
sanity documents query '*[_type == "movie"][0..4]'
sanity documents query '*[_type == "post"]|order(_createdAt desc)[0]{title}' --dataset staging
sanity documents query '*[_id == "header"]{title}' --api-version v2024-01-01 --pretty
```

### Get a document by ID

```bash
sanity documents get myDocId --pretty
```

### Create documents

```bash
sanity documents create myDocument.json
sanity documents create --id myDocId --replace          # fetch + edit + replace
sanity documents create --id myDocId --watch --replace   # re-create on each save
```

### Delete documents

```bash
sanity documents delete myDocId
sanity documents delete doc1 doc2
sanity documents delete --dataset=blog someDocId
```

## Schemas CLI

### Validate schemas

Check schema configuration for errors (does not check document content):

```bash
sanity schemas validate
sanity schemas validate --workspace default
sanity schemas validate --level error
```

### Deploy schemas

Deploy schema documents into workspace datasets:

```bash
sanity schemas deploy
sanity schemas deploy --workspace default
```

### Extract schema

Extract a JSON representation of the schema (used by TypeGen and tooling):

```bash
sanity schemas extract
sanity schemas extract --workspace default --path schema.json
sanity schemas extract --enforce-required-fields
sanity schemas extract --watch
```

### List schemas

```bash
sanity schemas list
sanity schemas list --id _.schemas.workspaceName --json
```

## Datasets CLI

### Export a dataset

```bash
sanity datasets export <dataset> backup.tar.gz
sanity datasets export <dataset> backup.tar.gz --no-assets
```

### Import data

```bash
sanity datasets import data.ndjson <dataset>
sanity datasets import data.ndjson <dataset> --replace
```

### Copy a dataset

```bash
sanity datasets copy <source> <target>
```

Exports are billed against the API quota; documents are streamed to minimize
usage.

## Schema change management workflow

### During development

1. Make schema changes and commit to git
2. Run `sanity schemas validate` to catch schema config errors
3. Run `sanity documents validate` to see what documents need updating
4. Scaffold a migration with `sanity migration create`
5. Dry-run with `sanity migrations run <id>`
6. Execute with `--no-dry-run`
7. Update queries and downstream code

### For production

1. **Back up**: `sanity datasets export` or `sanity datasets copy` to staging
2. **Deprecate**: use `deprecated: { reason: '...' }` on fields/types being removed
3. Run `sanity documents validate` against the staging dataset
4. Scaffold and dry-run the migration against staging
5. Execute against staging and test thoroughly
6. Write defensive queries using `coalesce(newField, oldField)` for rollout
7. Deploy application changes
8. Execute migration against production
9. Clean up defensive code paths once confirmed

### Idempotent migrations

Prefer migrations that produce the same result when run multiple times:

- Use `filter` to skip already-migrated documents:
  `filter: 'defined(category) && !defined(categories)'`
- Use `setIfMissing` over `set` when the field might already have the correct value
- Check preconditions: `if (!('oldField' in doc)) return`

When idempotency isn't possible, write a marker:

```typescript
const KEY = 'migration-xyz'
export default defineMigration({
  filter: `!("${KEY}" in coalesce(_migrations, []))`,
  migrate: {
    document(doc) {
      return [
        // ... your mutations ...
        at('_migrations', setIfMissing([])),
        at('_migrations', append(KEY)),
      ]
    },
  },
})
```

## Key considerations

- **Editors may be editing** while a migration runs. Warn the team first.
- **Migrations share API rate limits.** Lower `--concurrency` if you hit 429s.
- **Immutable fields** (`_id`, `_type`, `_createdAt`) cannot be patched.
  Export → edit NDJSON → re-import to change these.
- **Schema changes don't auto-update content.** Changing a schema does not
  delete or transform existing documents.
- **Strong references** block deletion. Remove or reassign refs before deleting.
- **Draft and version documents** are included by default. Filter them out if
  needed: `!(_id in path("drafts.**"))`, `!(_id in path("versions.**"))`.

## Additional resources

- For migration code patterns (`defineMigration`, `at`, `set`, etc.), see the
  `sanity-content-migrations` skill
- For full flag tables and advanced CLI details, see [reference.md](reference.md)
