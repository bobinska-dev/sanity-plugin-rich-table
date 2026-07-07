# Sanity CLI reference

Detailed flag tables, output formats, and advanced patterns beyond what
SKILL.md covers. All commands assume `pnpm dlx sanity@latest` in this repo.

## `sanity migrations run` — full flags

```
USAGE
  $ sanity migrations run [ID]
    [--api-version <value>]
    [--concurrency <value>]
    [--confirm]
    [--dataset <value>]
    [--dry-run]
    [--from-export <value>]
    [--progress]
    [--project <value>]
```

| Flag            | Type    | Default       | Notes                                   |
| --------------- | ------- | ------------- | --------------------------------------- |
| `--dry-run`     | boolean | `true`        | `--no-dry-run` to execute               |
| `--confirm`     | boolean | `true`        | `--no-confirm` to skip prompt           |
| `--dataset`     | string  | CLI config    | Target dataset                          |
| `--project`     | string  | CLI config    | Target project ID                       |
| `--from-export` | path    | —             | Local `.tar.gz` for dry-run source only |
| `--concurrency` | 1–10    | 6             | Parallel mutation requests              |
| `--progress`    | boolean | `true`        | `--no-progress` to hide                 |
| `--api-version` | string  | `v2024-01-29` | API version for mutations               |

## `sanity documents validate` — full flags

```
USAGE
  $ sanity documents validate
    [-d <name>] [-p <id>]
    [--yes]
    [--file <value>]
    [--format <value>]
    [--level <value>]
    [--max-custom-validation-concurrency <value>]
    [--max-fetch-concurrency <value>]
    [--workspace <value>]
```

| Flag                                  | Type    | Default          | Notes                                      |
| ------------------------------------- | ------- | ---------------- | ------------------------------------------ |
| `-d, --dataset`                       | string  | workspace config | Override dataset                           |
| `-p, --project-id`                    | string  | workspace config | Override project                           |
| `-y, --yes`                           | boolean | `false`          | Skip confirmation                          |
| `--file`                              | path    | —                | `.ndjson` or `.tar.gz` to validate locally |
| `--format`                            | string  | `pretty`         | `pretty`, `json`, or `ndjson`              |
| `--level`                             | string  | `warning`        | Minimum: `error`, `warning`, `info`        |
| `--workspace`                         | string  | —                | Workspace name (multi-workspace projects)  |
| `--max-custom-validation-concurrency` | number  | —                | Concurrent custom validators               |
| `--max-fetch-concurrency`             | number  | —                | Concurrent `client.fetch` calls            |

### Validation output anatomy

Each JSON/NDJSON entry:

```json
{
  "documentId": "person_robin-sachs",
  "documentType": "person",
  "revision": "GspWPjs815p7KTxv2q3x76",
  "intentUrl": "https://my-studio.sanity.studio/intent/edit/id=person_robin-sachs;type=person",
  "markers": [
    {
      "path": ["fullName"],
      "level": "warning",
      "message": "Field 'fullName' does not exist on type 'person'"
    }
  ],
  "level": "warning"
}
```

- `intentUrl` opens the document in a deployed Studio
- `level` at root reflects the most severe marker
- Pipe large outputs to a file and use GROQ CLI:

```bash
sanity documents validate -y --format ndjson > validations.ndjson
cat validations.ndjson | groq -n "*[level == 'error'].intentUrl"
cat validations.ndjson | groq -n "*[documentType == 'post'] | count"
```

## `sanity documents query` — full flags

```
USAGE
  $ sanity documents query QUERY
    [-d <name>] [-p <id>]
    [--anonymous]
    [--api-version <value>]
    [--pretty]
```

| Flag               | Type    | Default      | Notes                         |
| ------------------ | ------- | ------------ | ----------------------------- |
| `-d, --dataset`    | string  | CLI config   | Target dataset                |
| `-p, --project-id` | string  | CLI config   | Target project                |
| `--anonymous`      | boolean | `false`      | Send query without auth token |
| `--api-version`    | string  | `2025-08-15` | API version                   |
| `--pretty`         | boolean | `false`      | Colorize JSON output          |

## `sanity documents create` — full flags

```
USAGE
  $ sanity documents create [FILE]
    [-d <name>] [-p <id>]
    [--id <value>]
    [--json5]
    [--missing]
    [--replace]
    [--watch]
```

| Flag        | Type    | Notes                                         |
| ----------- | ------- | --------------------------------------------- |
| `--id`      | string  | Document ID to fetch and populate editor with |
| `--json5`   | boolean | Allow simplified JSON syntax                  |
| `--missing` | boolean | On duplicate IDs, skip (don't modify)         |
| `--replace` | boolean | On duplicate IDs, replace existing            |
| `--watch`   | boolean | Re-create on each save                        |

## `sanity documents delete` — full flags

```
USAGE
  $ sanity documents delete ID [IDS]
    [-d <name>] [-p <id>]
```

Accepts one or more document IDs. Quotes optional.

## `sanity documents get` — full flags

```
USAGE
  $ sanity documents get DOCUMENTID
    [-d <name>] [-p <id>]
    [--pretty]
```

## `sanity schemas validate` — full flags

```
USAGE
  $ sanity schemas validate
    [--format <value>]
    [--level <value>]
    [--workspace <value>]
    [--debug-metafile-path <value>]
```

| Flag                    | Type   | Notes                                     |
| ----------------------- | ------ | ----------------------------------------- |
| `--format`              | string | Output format for errors and warnings     |
| `--level`               | string | Minimum level reported                    |
| `--workspace`           | string | Target workspace                          |
| `--debug-metafile-path` | path   | Write esbuild metafile for build analysis |

## `sanity schemas deploy` — full flags

```
USAGE
  $ sanity schemas deploy
    [--extract-manifest]
    [--manifest-dir <directory>]
    [--tag <tag>]
    [--verbose]
    [--workspace <name>]
```

Deploys schema documents into workspace datasets. Re-generates the manifest
file by default; use `--no-extract-manifest` to reuse an existing one.

## `sanity schemas extract` — full flags

```
USAGE
  $ sanity schemas extract
    [--enforce-required-fields]
    [--format <format>]
    [--path <value>]
    [--watch]
    [--watch-patterns <glob>]
    [--workspace <name>]
```

| Flag                        | Type    | Notes                                           |
| --------------------------- | ------- | ----------------------------------------------- |
| `--enforce-required-fields` | boolean | Treat required fields as non-optional in output |
| `--format`                  | string  | Currently only GROQ type nodes                  |
| `--path`                    | path    | Destination file                                |
| `--watch`                   | boolean | Re-extract on changes                           |
| `--watch-patterns`          | glob    | Additional patterns to watch                    |
| `--workspace`               | string  | Target workspace                                |

## `sanity schemas list` — full flags

```
USAGE
  $ sanity schemas list
    [--id <schema_id>]
    [--json]
```

## Deprecating schema types

Mark document or field types as deprecated with a `reason`. The deprecation
appears in Studio UI and the GraphQL API schema:

```typescript
export const person = defineType({
  name: 'person',
  type: 'document',
  deprecated: { reason: 'Use the Author document type instead.' },
  fields: [],
  readOnly: true,
})

export const firstName = defineField({
  name: 'firstName',
  type: 'string',
  deprecated: { reason: 'Use the name field instead.' },
  readOnly: true,
})
```

Use `readOnly: true` alongside `deprecated` to prevent further edits.

## Migrating immutable fields (`_id`, `_type`)

These cannot be changed via the migration API. Use the export/import approach:

1. `sanity datasets export <dataset> backup.tar.gz` (add `--no-assets` if
   assets don't need changing)
2. Untar: `tar -xzvf backup.tar.gz`
3. Edit the `.ndjson` file (update `_id`, `_type` values)
4. Update all `_ref` values pointing to changed `_id`s
5. Re-import: `sanity datasets import data.ndjson <dataset> --replace`
6. Create a migration to delete old documents if needed

## Defensive queries during rollout

Use GROQ `coalesce` to support both old and new field shapes while migrating:

```groq
*[_type == "post"] {
  "title": coalesce(newTitle, oldTitle),
  "slug": coalesce(slug.current, legacySlug)
}
```

This lets the frontend work with both pre- and post-migration documents.

## CI/CD integration

Migration scripts are regular TypeScript files in `migrations/`. You can run
them in CI pipelines:

```bash
# in a CI step, after schema deployment
pnpm dlx sanity@latest migrations run <id> --no-dry-run --no-confirm --dataset production
```

Ensure the CI environment has:

- `SANITY_AUTH_TOKEN` with write access
- Project ID and dataset configured in `sanity.cli.ts` or via `--project`/`--dataset` flags

## Rate limits and performance

- Migrations share [Content Lake rate limits](https://www.sanity.io/docs/content-lake/technical-limits)
  with all other API interactions.
- Default concurrency is 6 parallel mutation requests.
- Lower `--concurrency` (e.g. to 1–3) if you hit 429 errors.
- Use `--from-export` with a local tarball for faster dry-runs on large datasets
  (avoids API calls during the read phase).
- `sanity documents validate` runs in a virtual browser environment — custom
  validation functions execute locally.
