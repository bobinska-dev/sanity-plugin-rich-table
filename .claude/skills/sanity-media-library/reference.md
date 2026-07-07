# Media Library HTTP API reference

Base URL: `https://api.sanity.io/{apiVersion}/media-libraries/{libraryId}`

Minimum API version: `v2025-02-19`. All requests to private data require
Bearer token auth with read+write access.

## Endpoints

### Mutate assets

`POST /mutate`

Same mutation syntax as Content Lake's Mutation API. Supports `set`,
`setIfMissing`, `unset`, `inc`, `dec`, `insert`, `diffMatchPatch`.

```json
{
  "mutations": [
    {
      "patch": {
        "id": "<asset-id>",
        "setIfMissing": { "aspects": {} },
        "set": { "aspects.copyright.copyrightHolder": "Sanity Inc." }
      }
    }
  ]
}
```

### Query assets

`GET /query?query=<GROQ>`

Standard GROQ query against the Media Library dataset. Returns `{ query, result, syncTags, ms }`.

### Upload asset

`POST /upload?type=image|video|file&filename=<name>`

Body: `multipart/form-data` with `file` field.

Optional params: `title`, `autoGenerateTitle`, `assetId`, `cdnAccessPolicy`, `sha1`.

Response includes `asset` (container), `assetInstance`, and `uploadSession`.

CDN access policies: `public`, `authenticated`, `private`.

### Search assets

`GET /refsearch?term=<search>&filter=<GROQ>&projection=<fields>`

Optional: `perspective` (default `published`), `cursor`, `limit` (default 10).

### List references to an asset

`GET /references/documents/{assetId}/to`

Returns `{ references[], totalCount, nextCursor }`. Only available on API version `vX`.

Each reference has `sourceDocumentRef` (global doc ref format:
`{resourceName}:{resourceId}.{dataset}:{documentId}`) and `sourceFieldPaths[]`.

### Video playback

`GET /video/{videoId}/playback-info`

Returns `{ id, stream, thumbnail, animated, storyboard, duration, aspectRatio, subtitles[], renditions[] }`.

Optional params for thumbnail/animated customization: `thumbnailWidth`, `thumbnailHeight`,
`thumbnailTime`, `thumbnailFit`, `thumbnailFormat`, `animatedWidth`, etc.

`GET /video/{videoId}/playback/{type}` — redirect to stream/thumbnail/animated/storyboard URL.

`GET /video/{videoId}/renditions/{name}` — redirect to downloadable MP4 (e.g. `720p.mp4`).

### Subtitles

`POST /video/{videoId}/subtitles` — AI-generated subtitles. Body: `{ languageCode }` (or `"auto"`).

`POST /video/{videoId}/subtitles/upload` — upload VTT/SRT. Params: `languageCode`, `format`, `closedCaptions`.

`DELETE /video/{videoId}/subtitles/{subtitleId}`.

### Signing keys

| Method | Path                    | Purpose                               |
| ------ | ----------------------- | ------------------------------------- |
| POST   | `/signing-keys`         | Create key (returns private key once) |
| GET    | `/signing-keys`         | List all keys                         |
| GET    | `/signing-keys/{keyId}` | Get specific key                      |
| DELETE | `/signing-keys/{keyId}` | Revoke/delete key                     |

Key type default: `ed25519`. Status: `active` or `revoked`.

## Asset document schema

```typescript
interface AssetContainer {
  _id: string
  _type: 'sanity.asset'
  assetType: 'sanity.imageAsset' | 'sanity.videoAsset' | 'sanity.fileAsset'
  title: string
  cdnAccessPolicy: 'public' | 'authenticated' | 'private'
  aspects: Record<string, unknown>
  currentVersion: { _ref: string; _type: string }
  versions: Array<{
    _key: string
    _type: string
    title: string
    instance: { _ref: string }
  }>
}
```

## Video playback URL patterns

| Type         | URL pattern                                                              |
| ------------ | ------------------------------------------------------------------------ |
| HLS stream   | `https://stream.m.sanity-cdn.com/{playbackId}.m3u8`                      |
| Thumbnail    | `https://image.m.sanity-cdn.com/{playbackId}/thumbnail.{jpg\|png\|webp}` |
| Animated GIF | `https://image.m.sanity-cdn.com/{playbackId}/animated.gif`               |

Thumbnail params: `width`, `height`, `fit_mode` (crop/preserve/stretch/pad), `time` (seconds).

## Linking library assets to dataset documents

1. Upload or query asset → get `asset._id` (Asset ID) and `currentVersion._ref` (Instance ID).
2. `POST https://{projectId}.api.sanity.io/v2025-02-19/assets/media-library-link/{dataset}`:
   ```json
   {
     "mediaLibraryId": "<id>",
     "assetInstanceId": "<instance-ref>",
     "assetId": "<asset-id>"
   }
   ```
   Response includes `document._id` (local asset doc) and `document.media._ref` (global ref).
3. Patch target document:
   ```json
   {
     "patch": {
       "id": "<document-id>",
       "set": {
         "imageField": {
           "asset": { "_type": "reference", "_ref": "<local-asset-doc-id>" },
           "media": { "_type": "globalDocumentReference", "_ref": "<media-ref>", "_weak": true }
         }
       }
     }
   }
   ```

## Limits

- Max file size: 5 TB
- Max upload duration: 1 hour
- Max image size: 256 megapixels
- Max request body: 100 MB
- Shares Content Lake rate limits
- Video originals are not retained (transcoded for streaming)
