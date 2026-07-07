# Content migration reference

Additional patterns and CLI details beyond what SKILL.md covers.

## CLI command reference

### `sanity migration create [TITLE]`

Scaffolds a new migration file. Prompts for title, target document types, and
a starter template.

### `sanity migrations list`

Lists all migrations discovered in the `migrations/` folder.

### `sanity migrations run [ID]`

| Flag                   | Description                                                            |
| ---------------------- | ---------------------------------------------------------------------- |
| `--dry-run`            | Default. Shows patches without writing. Use `--no-dry-run` to execute. |
| `--dataset <name>`     | Target dataset (defaults to CLI config).                               |
| `--project <id>`       | Target project (defaults to CLI config).                               |
| `--from-export <file>` | Use a local `.tar.gz` export as source (dry-run only).                 |
| `--concurrency <1-10>` | Parallel mutation requests (default 6).                                |
| `--confirm`            | Prompt before running (default true). Use `--no-confirm` to skip.      |
| `--api-version <ver>`  | API version (default `v2024-01-29`).                                   |

## Validation CLI

```bash
# pretty-printed validation report
npx sanity documents validate

# machine-readable NDJSON
npx sanity documents validate -y --format ndjson > validations.ndjson

# validate a local export file
npx sanity documents validate --file production.tar.gz
```

Each validation entry includes `documentId`, `documentType`, `revision`,
`intentUrl` (Studio link), `markers[]` with `path`, `level`, and `message`,
and a root `level` reflecting the most severe marker.

## Additional cheat sheet patterns

### Convert Portable Text to plain text

```typescript
import { pathsAreEqual, stringToPath, type PortableTextBlock } from 'sanity'
import { defineMigration, set } from 'sanity/migrate'

const targetPath = stringToPath('description')

function toPlainText(blocks: PortableTextBlock[]) {
  return blocks
    .map((block) => {
      if (block._type !== 'block' || !block.children) return ''
      return (block.children as { text: string }[]).map((c) => c.text).join('')
    })
    .join('\n\n')
}

export default defineMigration({
  title: 'Convert Portable Text to plain text',
  documentTypes: ['post'],
  migrate: {
    array(node, path) {
      if (pathsAreEqual(path, targetPath)) {
        return set(toPlainText(node as PortableTextBlock[]))
      }
    },
  },
})
```

### Migrate inline objects to references

```typescript
import { deburr } from 'lodash'
import { at, createIfNotExists, defineMigration, replace, patch } from 'sanity/migrate'

function getPetId(pet: { name: string }) {
  return `pet-${deburr(pet.name.toLowerCase())}`
}

export default defineMigration({
  title: 'Convert inline pets to references',
  documentTypes: ['human'],
  filter: 'defined(pets) && count(pets[]._ref) > 0',
  migrate: {
    document(human) {
      const currentPets = human.pets
      if (!Array.isArray(currentPets) || !currentPets.length) return

      return currentPets
        .filter((pet) => !pet._ref)
        .flatMap((pet) => {
          const petId = getPetId(pet)
          const { _key, ...petAttributes } = pet
          return [
            createIfNotExists({ _id: petId, _type: 'pet', ...petAttributes }),
            patch(
              human._id,
              at(['pets'], replace([{ _type: 'reference', _ref: petId }], { _key })),
            ),
          ]
        })
    },
  },
})
```

### Deduplicate arrays

```typescript
import { defineMigration, set } from 'sanity/migrate'

export default defineMigration({
  title: 'Dedupe tags array',
  documentTypes: ['post'],
  migrate: {
    array(node, path) {
      if (path.includes('tags')) {
        return set([...new Set(node)])
      }
    },
  },
})
```

### Migrate string to i18n array

```typescript
import { at, set, defineMigration } from 'sanity/migrate'

export default defineMigration({
  title: 'Wrap greeting into internationalized array',
  documentTypes: ['post'],
  migrate: {
    document(doc) {
      if (doc.greeting && typeof doc.greeting === 'string') {
        return at(
          'greeting',
          set([
            {
              _key: 'en',
              _type: 'internationalizedArrayStringValue',
              value: doc.greeting,
            },
          ]),
        )
      }
    },
  },
})
```

### Delete large unreferenced file assets

```typescript
import { defineMigration, del } from 'sanity/migrate'

export default defineMigration({
  title: 'Delete file assets over 50 MB',
  documentTypes: ['sanity.fileAsset'],
  filter: 'size > 50000000 && count(*[references(^._id)]) == 0',
  migrate: {
    document(doc) {
      return del(doc._id)
    },
  },
})
```

## Migrating immutable fields (\_id, \_type)

These cannot be patched via the migration API. Use the export/import approach:

1. `npx sanity datasets export <dataset> backup.tar.gz`
2. Untar: `tar -xzvf backup.tar.gz`
3. Edit the `.ndjson` file (find/replace `_type`, update `_id` values)
4. Update all `_ref` values pointing to changed `_id`s
5. Re-import: `npx sanity datasets import data.ndjson <dataset> --replace`

## Understanding node traversal

The `node`, `object`, `array`, `string`, `number`, `boolean`, and `null`
handlers traverse every value in every matched document. The `path` argument
tells you where the value lives:

- Top-level field: `['title']`
- Slug current: `['slug', 'current']`
- Array item child: `['body', {_key: 'abc123'}, 'children', {_key: 'xyz'}, 'text']`

Use `node()` when you only need the matched value. Use `extractWithPath` from
`@sanity/mutator` with `document()` when you need the parent document context.
