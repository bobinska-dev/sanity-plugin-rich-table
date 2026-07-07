---
name: sanity-media-library
description: >-
  Sanity Media Library integration for centralized asset management across Studios
  and SDK apps. Covers Studio enablement, per-field filters, aspects, collections,
  video fields, programmatic uploads, asset linking, and CLI commands. Use when
  enabling Media Library in a Studio config, adding image or file fields that
  reference library assets, creating or deploying aspects, writing GROQ queries
  against library assets, configuring per-app asset scoping, or working with
  video playback from the library.
---

# Sanity Media Library

Media Library is an organization-wide, centralized asset store. Assets live in a
shared dataset and can be used across multiple Studios and datasets. It replaces
the per-dataset asset model with a single source of truth.

**Enterprise plan addon.** Requires Studio v3.82.0+ and API version v2024-06-24+.

## Quick reference

| Concept                        | Purpose                                                                   |
| ------------------------------ | ------------------------------------------------------------------------- |
| **Assets**                     | Images, videos, files stored centrally; can be public or private          |
| **Aspects**                    | Schema-defined metadata fields attached to assets (copyright, tags, etc.) |
| **Collections**                | User-created groupings for organizing assets                              |
| **Filters**                    | Per-field GROQ filters that scope asset selection in Studio               |
| **Global document references** | Cross-resource references connecting library assets to dataset documents  |

## Enable Media Library in a Studio

```typescript
// sanity.config.ts
import { defineConfig } from 'sanity'

export default defineConfig({
  projectId: '<project-id>',
  dataset: '<dataset>',
  mediaLibrary: {
    enabled: true,
  },
  auth: {
    loginMethod: 'token', // required for full functionality
  },
  // ...
})
```

Token-based auth is strongly recommended. Cookie-based auth disables private
asset previews, signing key management, downloads, and asset version syncing.

## Scope assets per field with filters

Use `options.mediaLibrary.filters` on image or file fields to control which
assets editors see when browsing the library from that specific field. This is
the primary mechanism for making life easier for editors -- each field can show
only the assets relevant to its purpose.

```typescript
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'article',
  type: 'document',
  fields: [
    defineField({
      name: 'heroImage',
      type: 'image',
      options: {
        mediaLibrary: {
          filters: [
            {
              name: 'High resolution (>4000px)',
              query: 'currentVersion->metadata.dimensions.width > 4000',
            },
            {
              name: 'Has copyright info',
              query: 'defined(aspects.copyright)',
            },
          ],
        },
      },
    }),
  ],
})
```

Each filter has a `name` (shown to editors) and a `query` (GROQ filter against
the Media Library dataset). Combine aspect queries with dimension/type checks to
create contextual browsing experiences per field.

### Common filter patterns

| Intent                             | Filter query                                       |
| ---------------------------------- | -------------------------------------------------- |
| Only images with a specific aspect | `defined(aspects.brand)`                           |
| High-res images                    | `currentVersion->metadata.dimensions.width > 4000` |
| Specific asset type                | `assetType == "sanity.imageAsset"`                 |
| Public assets only                 | `cdnAccessPolicy == "public"`                      |

## Disable the default asset source

To force editors to use only the Media Library (no local dataset uploads):

```typescript
export default defineConfig({
  mediaLibrary: { enabled: true },
  form: {
    image: {
      assetSources: (sources) => sources.filter((s) => s.name !== 'sanity-default'),
    },
    file: {
      assetSources: (sources) => sources.filter((s) => s.name !== 'sanity-default'),
    },
  },
})
```

To target the Media Library source explicitly, compare with `'sanity-media-library'`.

## Aspects

Aspects are schema-like metadata attached to assets. They are defined in code
with `defineAssetAspect` and deployed via the CLI. They cannot contain
executable code (no custom validation, components, callbacks, `hidden`,
`readOnly`, `initialValue` functions, or image/file types).

### Configure the CLI

```typescript
// sanity.cli.ts
import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: { projectId: '<id>', dataset: '<dataset>' },
  mediaLibrary: {
    aspectsPath: 'aspects', // relative to sanity.cli.ts
  },
})
```

### Define an aspect

```typescript
// aspects/copyright.ts
import { defineAssetAspect, defineField } from 'sanity'

export default defineAssetAspect({
  name: 'copyright',
  title: 'Copyright',
  type: 'object',
  fields: [
    defineField({
      name: 'copyrightHolder',
      title: 'Copyright Holder',
      type: 'string',
    }),
    defineField({
      name: 'copyrightDate',
      title: 'Date',
      type: 'date',
    }),
  ],
  public: true, // allows querying via media::aspect() from datasets
})
```

Mark aspects as `public: true` to query their values from dataset GROQ:

```groq
*[_type == "post"] {
  title,
  mainImage {
    asset,
    "copyright": media::aspect(media, "copyright")
  }
}
```

### Deploy aspects

```bash
# Deploy a single aspect
sanity media deploy-aspect copyright

# Deploy all aspects
sanity media deploy-aspect --all

# Delete an aspect
sanity media delete-aspect copyright
```

### Global document references in aspects

Reference documents from other datasets inside aspects:

```typescript
import { defineAssetAspect } from 'sanity'

export default defineAssetAspect({
  name: 'photographer',
  title: 'Photographer',
  type: 'globalDocumentReference',
  resourceType: 'dataset',
  resourceId: '<projectId>.<dataset>',
  weak: true,
  to: [{ type: 'photographer', preview: { select: { title: 'name' } } }],
})
```

## Video fields

Video requires the Video addon (contact sales). Use `defineVideoField` from
`sanity/media-library`:

```typescript
import { defineVideoField } from 'sanity/media-library'

export default {
  name: 'videoDocument',
  type: 'document',
  fields: [defineVideoField({ name: 'video', title: 'Featured Video' })],
}
```

### Fetch playback info

```typescript
import { createClient } from '@sanity/client'

const client = createClient({
  apiVersion: '2025-03-25',
  useCdn: false,
  token: '<token>',
  resource: { type: 'media-library', id: '<library-id>' },
})

const playbackInfo = await client.mediaLibrary.video.getPlaybackInfo(doc.video.asset)
// Returns: { stream, thumbnail, animated, storyboard, duration, aspectRatio }
```

### Render with Mux Player

```tsx
import MuxPlayer from '@mux/mux-player-react'
;<MuxPlayer
  customDomain="m.sanity-cdn.com"
  playbackId={playbackId}
  style={{ width: '100%', aspectRatio }}
/>
```

## Programmatic uploads and mutations

### Upload via HTTP API

```typescript
await fetch(
  `https://api.sanity.io/v2025-02-19/media-libraries/${libraryId}/upload?type=image&filename=photo.jpg`,
  { method: 'POST', body: fileBuffer, headers: { Authorization: `Bearer ${token}` } },
)
```

### Assign aspects with @sanity/client

```typescript
const client = createClient({
  useCdn: false,
  token: '<token>',
  resource: { type: 'media-library', id: '<library-id>' },
})

await client
  .patch('<asset-id>')
  .setIfMissing({ aspects: {} })
  .set({ 'aspects.copyright.copyrightHolder': 'Sanity Inc.' })
  .commit()
```

### Link a library asset to a dataset document

1. Upload or query the asset to get `assetId` and `assetInstanceId`.
2. Call `POST /assets/media-library-link/{dataset}` with `{ mediaLibraryId, assetId, assetInstanceId }`.
3. Patch the document's image/file field with `asset._ref` and `media._ref` from the response.

## Media Library asset functions

React to asset events (upload, update, delete) with Sanity Functions:

```typescript
// sanity.blueprint.ts
import { defineBlueprint, defineMediaLibraryAssetFunction } from '@sanity/blueprints'

export default defineBlueprint({
  resources: [
    defineMediaLibraryAssetFunction({
      name: 'on-asset-update',
      event: {
        on: ['update'],
        filter: 'delta::changedAny(title)',
        projection: '{_id, title, assetType}',
        resource: { type: 'media-library', id: '<library-id>' },
      },
    }),
  ],
})
```

Requires `@sanity/blueprints` v0.4.0+ and `@sanity/functions` v1.1.0+.

## CLI commands

| Command                                            | Purpose                                      |
| -------------------------------------------------- | -------------------------------------------- |
| `sanity media create-aspect`                       | Scaffold a new aspect definition             |
| `sanity media deploy-aspect [name] [--all]`        | Deploy aspect(s) to the library              |
| `sanity media delete-aspect <name>`                | Remove an aspect from the library            |
| `sanity media import <source> [--replace-aspects]` | Import assets (directory or `.tar.gz`)       |
| `sanity media export [dest]`                       | Export assets + aspect data (excludes video) |

Always use `pnpm dlx sanity@latest` (never `npx`) in this repo.

## Editor experience best practices

1. **Use per-field filters** to scope the asset browser contextually.
   A hero image field should filter for high-res; a thumbnail field for smaller images.
2. **Create meaningful aspects** that editors actually need -- copyright, usage rights,
   campaign tags, product references. Avoid aspect sprawl.
3. **Use collections** for project- or campaign-based groupings that cut across aspects.
4. **Mark aspects public** when frontends need the data, so it is queryable with
   `media::aspect()` without extra API calls.
5. **Disable the default source** when the team should exclusively use the central library.
6. **Use token-based auth** in all Studios to avoid broken previews for private assets.

## Additional resources

- For the full HTTP API reference, see [reference.md](reference.md)
- For the changelog, see [changelog.md](changelog.md)
