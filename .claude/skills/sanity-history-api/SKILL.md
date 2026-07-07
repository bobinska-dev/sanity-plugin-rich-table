---
name: sanity-history-api
description: >-
  Sanity History API for reading real document change history — who changed
  what, and when. Covers the two HTTP endpoints (documents snapshots +
  transactions log), every query parameter (excludeContent, effectFormat=mendoza,
  fromTime/toTime, fromTransaction/toTransaction, authors, reverse, limit),
  the NDJSON transaction shape (id/timestamp/author/mutations/effects/documentIDs),
  resolving author ids to people, the draft-vs-published + dataset footguns, and
  how to call it from an SDK app (sdk-apps/*) via client.request or useAuthToken.
  Use when building change/diff/activity/audit UIs, "who edited this", review
  surfaces, or anything that needs real revision history rather than a
  published-vs-draft field diff.
---

# Sanity History API

The History API is the **only source of real authorship + timing** for content
changes. A published-vs-draft GROQ diff tells you _what differs now_; the History
API tells you _who changed each thing, in what order, and when_. Use it whenever a
UI needs to attribute changes to people (review "changes in this review" modals,
activity feeds, audit trails, "last edited by").

It is an **HTTP API only** — there is no first-class `@sanity/client` method and no
`@sanity/sdk-react` read hook. You call the raw endpoints. `useRecordDocumentHistoryEvent`
and `useDocumentEvent` in the SDK are for _writing/subscribing_ to events, not
reading past revisions.

## Two endpoints

Base: `https://<projectId>.api.sanity.io/v<apiVersion>/data/history/<dataset>/...`
The **dataset is part of the path** — see the dataset footgun below.

### 1. Documents — a snapshot at a point in time (JSON)

```
GET /v2025-02-19/data/history/<dataset>/documents/<documentId>
```

Query params (exactly one of):

- `revision=<_rev>` — the document as of that revision id
- `time=<ISO-8601>` — the document as it was at that instant
- `lastRevision=true` — current data, or the final state before deletion

Response is JSON: `{ "documents": [ { _id, _rev, _type, _createdAt, _updatedAt, ...fields } ] }`.

Use this to diff two known revisions with existing deep-diff code (see
`sdk-apps/coach/src/lib/reviewDiff.ts`): fetch `?revision=A` and `?revision=B`,
run `diffDocument(a, b)`. Robust and label-friendly, but N requests for N points.

### 2. Transactions — the ordered change log (NDJSON)

```
GET /v2025-02-19/data/history/<dataset>/transactions/<id1,id2,...>
```

The URL segment is a **comma-separated list of document ids**. For a review
surface you almost always want both the base id AND the draft id:
`<id>,drafts.<id>` (and any referenced content docs).

Query params:
| Param | Meaning |
|---|---|
| `excludeContent` | `true` = metadata only (id/timestamp/author/documentIDs — cheap). `false` = include content so you get `mutations`/`effects`. **Set it explicitly.** |
| `effectFormat=mendoza` | Adds an `effects` object per transaction (compact JSON diff). Requires `excludeContent=false`. |
| `fromTime` / `toTime` | ISO-8601 bounds on the transaction range. |
| `fromTransaction` / `toTransaction` | Bound by transaction/revision id. `fromTransaction=<published _rev>` = "everything since the last publish". |
| `authors` | Comma-separated author ids — return only these people's transactions. |
| `reverse` | `true` = newest first (what a UI usually wants). |
| `limit` | Max transactions. Always cap it. |
| `includeIdentifiedDocumentsOnly` | Only mutations touching the ids in the path (drops rides-along docs). |

**Response is NDJSON** — one JSON object per line, not a JSON array. You must read
it as text and `split('\n')`.

Transaction object:

```jsonc
{
  "id": "mXlLqCPElh7uu0wm84cjks", // transaction id (also a valid _rev)
  "timestamp": "2019-05-28T17:16:43.151Z", // ISO-8601, sub-second
  "author": "pDYrmFKn7", // Sanity USER id — not a document id
  "documentIDs": ["<id>", "drafts.<id>"], // docs this transaction touched
  "mutations": [
    /* create | createOrReplace | patch | delete */
  ],
  "effects": {
    // only with effectFormat=mendoza
    "drafts.<id>": {
      "apply": [
        /*mendoza*/
      ],
      "revert": [
        /*mendoza*/
      ],
    },
  },
}
```

## Getting "which fields changed"

Two tractable routes — **prefer mutations for labels**, use mendoza only if you
need compact effects:

1. **Parse `mutations[].patch` keys** (with `excludeContent=false`). A `patch` has
   `set` / `unset` / `insert` / `inc` / `diffMatchPatch`, each keyed by a **dotted
   path** (e.g. `description`, `todos[_key=="ab12"].title`). The top segment of each
   key is the changed root field → map through your existing label table
   (`DIFF_FIELD_LABELS` / `DOC_FIELD_LABELS`). `create`/`createOrReplace` = the whole
   doc changed (new / restored).
2. **Two-snapshot diff.** Read the doc at `fromTransaction` and now via the
   _documents_ endpoint and reuse `diffDocument`. Most accurate for labels; costs
   two fetches per boundary.

**Mendoza** (`effects[docId].apply`) is Sanity's compact diff format. It is
powerful but **non-trivial to parse into human labels** (nested array-encoded
ops), so don't reach for it just to list changed fields — its top-level keys do
correspond to changed root fields, but the mutation-path route above is simpler.

## Resolving the author id to a person

`author` is a **Sanity user id**, not a document id and not an email. This repo
already solves this in `sdk-apps/coach/src/components/Review/CommentUser.tsx`:

- `client.users.getById(id)` → the project user (has `email`, `displayName`, `imageUrl`).
- Match that email to the canonical Home `person` (name + photo) via
  `HOME_PEOPLE_BY_EMAILS_QUERY`.
- Or, for a single id in a component, the SDK hook
  `useUser({ userId, resourceType: 'project', projectId })`.

**Reuse `useResolvedUser` / `UserAvatarById` / `UserName` from `CommentUser.tsx`** —
don't re-resolve users. The transactions log will contain non-human authors too
(migrations, functions, tooling tokens); render those by id/label rather than as
a person.

## Calling it from an SDK app (sdk-apps/\*)

The SDK's `useClient()` returns a `@sanity/client`. Use `client.request` with
**`json: false`** so the NDJSON body comes back as text (the default JSON parse
chokes on newline-delimited objects):

```ts
import { useClient, useAuthToken } from '@sanity/sdk-react'
import { sanityDataset, sanityProjectId } from '@/environment'

const API_VERSION = '2025-02-19'

interface Transaction {
  id: string
  timestamp: string
  author: string
  documentIDs: string[]
  mutations?: Array<Record<string, any>>
}

async function fetchTransactions(client, ids: string[], sinceRev?: string) {
  const ndjson = await client.request<string>({
    url:
      `/data/history/${sanityDataset}/transactions/${ids.join(',')}` +
      `?excludeContent=false&reverse=true&limit=100` +
      (sinceRev ? `&fromTransaction=${sinceRev}` : ''),
    json: false, // NDJSON — parse manually
  })
  return ndjson
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Transaction)
}
```

`fetch()` + `useAuthToken()` is the fallback if you can't get raw text through the
client:

```ts
const token = useAuthToken()
const res = await fetch(
  `https://${sanityProjectId}.api.sanity.io/v${API_VERSION}` +
    `/data/history/${sanityDataset}/transactions/${ids.join(',')}?excludeContent=true&reverse=true`,
  { headers: token ? { Authorization: `Bearer ${token}` } : {} },
)
const text = await res.text()
```

## Footguns

- **Dataset footgun.** The dataset is in the URL path, so you MUST interpolate the
  _correct_ dataset (`sanityDataset` — `coach` vs `coach-staging`). Do not assume
  the client's configured dataset; a bare `useClient()` in coach can resolve the
  outermost app's dataset (production gate). See the SDK useClient dataset footgun
  note in project memory.
- **Draft vs published.** Live-editing plans have no draft; templates edit into
  `drafts.<id>`. Query both `<id>,drafts.<id>` (comma-separated) or you'll miss the
  in-flight changes. For "changes since last publish," pass
  `fromTransaction=<published document _rev>`.
- **NDJSON, not JSON.** Split on `\n` and parse each line. Never `JSON.parse` the
  whole body.
- **`excludeContent` is required-ish.** Set it explicitly (`true` for a cheap
  who/when overlay, `false` when you need changed fields).
- **Not real-time.** There's no subscription for history. Fetch on open / poll;
  combine with `useDocumentEvent` if you want to invalidate on live edits.
- **Access model.** If you can read the current document, you can read all its
  revisions. Needs the user's token — which the SDK client already carries.
- **Volume.** Busy docs have long logs. Always `limit` and bound by
  `fromTime`/`fromTransaction`.

## Two patterns for a "changes / who did it" UI

1. **Attribution overlay (cheap).** `excludeContent=true&reverse=true&limit=…` for
   the subject + referenced docs → the latest author + timestamp per doc. Enrich an
   existing field-diff list with "last touched by <avatar> · 5 min ago". One small
   request per doc; no mendoza parsing.
2. **Activity timeline (rich).** `excludeContent=false&fromTransaction=<published _rev>`
   → group transactions newest-first, render author avatar + relative time + the
   changed-field labels parsed from `mutations[].patch` keys. This is the real
   per-person, per-moment history.

## References

- History API reference: https://www.sanity.io/docs/history-api
- Field-level diffing Q&A: https://www.sanity.io/answers/using-history-api-to-get-changed-fields-and-author-s-name-in-sanity-io
- Author resolution already implemented: `sdk-apps/coach/src/components/Review/CommentUser.tsx`
- Deep-diff util to reuse with snapshots: `sdk-apps/coach/src/lib/reviewDiff.ts`
