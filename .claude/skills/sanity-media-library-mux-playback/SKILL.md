---
name: sanity-media-library-mux-playback
description: >-
  Display Sanity Media Library videos in a frontend using Mux Player. Covers
  the recommended GROQ `documents::get()` pattern for fetching playback id +
  aspect ratio in a single query, the alternative `client.mediaLibrary.video
  .getPlaybackInfo()` runtime call, schema setup with `defineVideoField`,
  signed playback handling, and common pitfalls (library-id regex strictness,
  TypeGen returning `unknown` for cross-resource projections, response shape
  confusion). Use when adding video playback to an SDK app or web frontend,
  building a `VideoPlayer` component, fetching `videoAsset` data from a Media
  Library video field, debugging "Invalid video asset instance identifier"
  errors, or wiring `@mux/mux-player-react` to Sanity content.
---

# Sanity Media Library + Mux Player

Sanity Media Library streams video through a CDN backed by Mux. Frontends
display videos with `@mux/mux-player-react` using a public `playbackId` plus
the asset's aspect ratio. There are two ways to obtain those values; **prefer
the GROQ approach**.

## TL;DR

```tsx
import MuxPlayer from '@mux/mux-player-react'
;<MuxPlayer
  customDomain="m.sanity-cdn.com"
  playbackId={video.playbackId}
  style={{ width: '100%', aspectRatio: video.aspectRatio ?? 16 / 9 }}
/>
```

Get `playbackId` and `aspectRatio` from a GROQ projection -- no runtime
client call needed for public playback.

## Schema setup

Use `defineVideoField` from `sanity/media-library` (Studio v4.0.1+ and
Video addon enabled).

```ts
import { defineVideoField } from 'sanity/media-library'

export default {
  name: 'resource',
  type: 'document',
  fields: [defineVideoField({ name: 'videoAsset', title: 'Video' })],
}
```

The field stores a Global Dataset Reference (GDR) to the asset:

```json
{
  "videoAsset": {
    "_type": "sanity.video",
    "asset": {
      "_type": "reference",
      "_ref": "media-library:<libraryId>:video-<hash>-<ext>"
    }
  }
}
```

## Recommended: read playback info via GROQ (`documents::get`)

`documents::get()` follows the GDR and projects fields directly from the
Media Library asset in the same query. No extra HTTP call, no client
reconfiguration, no GDR parsing.

```groq
*[_type == "resource" && slug.current == $slug][0] {
  _id,
  title,
  videoSource,
  "video": documents::get(videoAsset.asset) {
    "playbackId": metadata.playbacks[policy == "public"][0]._id,
    "aspectRatio": metadata.aspectRatio,
    "duration": metadata.duration
  }
}
```

Returned shape:

```json
{
  "video": {
    "playbackId": "V5uFaHghtnzgV6lYlBkrbehGkvd5KNGHYU7w2Eo7HoQ",
    "aspectRatio": 0.5625,
    "duration": 8.86
  }
}
```

### TypeGen caveat

TypeGen cannot statically resolve `documents::get()` (cross-resource lookup).
The generated type for the projection is `unknown | null`. Narrow it at the
component boundary with a small typed parser:

```ts
export type MuxVideo = {
  playbackId: string | null
  aspectRatio: number | null
  duration: number | null
}

export function parseMuxVideo(value: unknown): MuxVideo | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  const playbackId = typeof v.playbackId === 'string' ? v.playbackId : null
  if (!playbackId) return null
  return {
    playbackId,
    aspectRatio: typeof v.aspectRatio === 'number' ? v.aspectRatio : null,
    duration: typeof v.duration === 'number' ? v.duration : null,
  }
}
```

### Render

```tsx
import MuxPlayer from '@mux/mux-player-react'

const video = parseMuxVideo(data.video)

if (!video?.playbackId) return <FallbackPlaceholder />

return (
  <MuxPlayer
    customDomain="m.sanity-cdn.com"
    playbackId={video.playbackId}
    style={{ width: '100%', aspectRatio: video.aspectRatio ?? 16 / 9, borderRadius: 8 }}
  />
)
```

`aspectRatio` from Sanity is a number (e.g. `1.778`, `0.5625`), not a
string like `"16/9"`. CSS `aspect-ratio` accepts numbers.

## Alternative: `client.mediaLibrary.video.getPlaybackInfo()`

Use only when GROQ can't reach the data (for example, server-side jobs that
don't already have a query result, or when you need signed URLs / renditions
/ animated thumbnails). Requires API version `v2025-03-25` or later.

```ts
import { createClient } from '@sanity/client'

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-03-25',
  useCdn: false,
  resource: { type: 'media-library', id: libraryId },
})

const info = await client.mediaLibrary.video.getPlaybackInfo(
  doc.videoAsset.asset, // pass the GDR object, not just _ref string
)
// info.id          -> playbackId
// info.aspectRatio -> number
// info.stream      -> { url, token? }
// info.thumbnail   -> { url, token? }
// info.duration    -> seconds
```

### Signed playback (private videos)

```ts
import { isSignedPlaybackInfo, getPlaybackTokens } from '@sanity/client/media-library'

if (isSignedPlaybackInfo(info)) {
  const tokens = getPlaybackTokens(info)
  // Pass tokens.stream / tokens.thumbnail to MuxPlayer's `playbackToken` etc.
}
```

## Common pitfalls

### "Invalid video asset instance identifier" thrown by `getPlaybackInfo`

The client parses identifiers with this regex:

```js
;/^media-library:(ml[^:]+):([^:]+)$/
```

It accepts:

- A bare instance id starting with `video-…` (requires the client to be
  configured with `resource.id`)
- A GDR string or `{ _ref }` object whose **library id starts with `ml`**

If your library id has a different prefix (we've seen `al…` in the wild),
the regex fails. Workarounds, in order of preference:

1. **Switch to the GROQ `documents::get()` approach** -- bypasses the parser
   entirely.
2. Parse the GDR yourself, configure a client with the library id, and pass
   only the bare instance id:

   ```ts
   const m = /^media-library:([^:]+):(.+)$/.exec(ref)
   if (!m) throw new Error(`Bad GDR: ${ref}`)
   const [, libraryId, instanceId] = m
   const lib = client.withConfig({ resource: { type: 'media-library', id: libraryId } })
   const info = await lib.mediaLibrary.video.getPlaybackInfo(instanceId)
   ```

### Wrong response field

The Mux playback id lives at `info.id`, **not** `info.stream.playbackId`.
`info.stream` is `{ url, token? }`, not a string. `info.aspectRatio` is a
`number`, not a string like `"16/9"`.

### `videoAsset.asset->url` is always null

`->` dereference does not cross resources. The Media Library asset lives in
a separate dataset, so `videoAsset.asset->url` returns null. Use
`documents::get()` for any cross-resource projection. The `->` operator only
works on regular `file`/`image` assets stored in the same dataset.

### TypeGen marks the projection as `unknown`

Expected. TypeGen has no schema for the cross-resource document. Narrow with
`parseMuxVideo` (or similar) at the boundary -- don't try to "fix" the type
in `sanity.types.ts`.

## When the asset isn't ready

Newly uploaded videos are processed asynchronously. Until processing
completes, `metadata.playbacks` is empty and `playbackId` will be `null`.
Always render a fallback ("Video processing…" or skeleton) when
`playbackId` is missing rather than crashing the player.

## Reference: working example in this repo

- Component: `sdk-apps/coach/src/components/VideoPlayer/VideoPlayer.tsx`
- Helper: `parseMuxVideo` exported from the same file
- Query: `resourceDetailProjection` in `sdk-apps/coach/src/lib/groq.ts`
- Consumers: `ResourceDetailPage.tsx`, `ModuleDetailPage.tsx`

## Sources

All patterns above are validated against the official documentation listed
below. When in doubt, follow these:

- [Sanity Docs -- Working with video](https://www.sanity.io/docs/media-library/working-with-video)
  -- canonical reference for the GROQ `documents::get()` pattern, response
  shape, and the basic Mux Player snippet.
- [@sanity/client README -- Getting video playback information](https://github.com/sanity-io/client#getting-video-playback-information)
  -- input formats accepted by `getPlaybackInfo` (instance id string, GDR
  object), transformation options, signed-playback response shape.
- [@sanity/client `getPlaybackTokens` reference](https://reference.sanity.io/_sanity/client/media-library/getPlaybackTokens/)
  -- API for extracting signed-playback tokens.
- [Mux Player for web](https://www.mux.com/docs/guides/mux-player-web)
  -- player props, React component usage, theming.
- [Mux Player customization](https://www.mux.com/docs/guides/player-customize-look-and-feel)
  -- accent colors, themes, CSS custom properties.
- [Sanity Media Library skill](../sanity-media-library/SKILL.md)
  -- broader context on aspects, filters, programmatic uploads, and
  Studio configuration.
