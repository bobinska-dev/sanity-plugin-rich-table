# Real-Time Data Patterns

## client.listen() — Direct Subscriptions

For real-time updates outside of Studio's document store:

```tsx
import {useEffect, useState} from 'react'
import {useClient} from 'sanity'

function LivePostList() {
  const client = useClient({apiVersion: '2024-01-01'})
  const [posts, setPosts] = useState<Post[]>([])

  // Initial fetch
  useEffect(() => {
    client.fetch(\`*[_type == "post"] | order(_createdAt desc)\`).then(setPosts)
  }, [client])

  // Real-time listener
  useEffect(() => {
    const subscription = client
      .listen(
        \`*[_type == "post"]\`,
        {},
        {includeResult: true, visibility: 'query'}
      )
      .subscribe(update => {
        if (update.transition === 'appear') {
          setPosts(prev => [update.result as Post, ...prev])
        }
        if (update.transition === 'disappear') {
          setPosts(prev => prev.filter(p => p._id !== update.documentId))
        }
        if (update.transition === 'update') {
          setPosts(prev =>
            prev.map(p => (p._id === update.documentId ? (update.result as Post) : p))
          )
        }
      })

    // ALWAYS unsubscribe in cleanup
    return () => subscription.unsubscribe()
  }, [client])

  return (
    <Stack space={3}>
      {posts.map(post => (
        <Card key={post._id} padding={3} border radius={2}>
          <Text>{post.title}</Text>
        </Card>
      ))}
    </Stack>
  )
}
```

### Listener Options

| Option                    | Type                       | Description                                                                 |
| ------------------------- | -------------------------- | --------------------------------------------------------------------------- |
| `includeResult`           | `boolean`                  | Include full document in `update.result`                                    |
| `includePreviousRevision` | `boolean`                  | Include previous version                                                    |
| `visibility`              | `'query' \| 'transaction'` | `'query'` waits for consistency, `'transaction'` is faster but may be stale |
| `tag`                     | `string`                   | Tag for analytics                                                           |

### Transition Types

| Transition    | Meaning                                     |
| ------------- | ------------------------------------------- |
| `'appear'`    | Document created or now matches query       |
| `'disappear'` | Document deleted or no longer matches query |
| `'update'`    | Document updated and still matches query    |

---

## useDocumentStore + listenQuery (Preferred in Studio)

The recommended approach inside Studio — uses the document store's built-in caching and real-time updates:

```tsx
import {useMemo} from 'react'
import {useDocumentStore} from 'sanity'
import {useObservable} from 'react-rx'

function useListenQuery<T>(query: string, params: Record<string, unknown> = {}) {
  const documentStore = useDocumentStore()
  const observable = useMemo(
    () => documentStore.listenQuery(query, params, {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [documentStore, query, JSON.stringify(params)]
  )
  return useObservable<T | null>(observable, null)
}

// Usage
function PostDashboard() {
  const posts = useListenQuery<Post[]>(
    \`*[_type == "post"] | order(_createdAt desc)[0..19]{ _id, title, _updatedAt }\`
  )

  if (posts === null) {
    return <Spinner muted />
  }

  return (
    <Stack space={2}>
      {posts.map(post => (
        <Card key={post._id} padding={3} border radius={2}>
          <Text>{post.title}</Text>
        </Card>
      ))}
    </Stack>
  )
}
```

**Advantages over client.listen():**

- Automatic caching and deduplication
- Handles draft/published merging
- No manual subscription management (useObservable handles it)
- Consistent with Studio's data layer

---

## Draft Filtering

When querying with `client.listen()` or `client.fetch()`, you may get both draft and published versions. Filter drafts:

```groq
// Exclude drafts
*[_type == "post" && !(_id in path("drafts.**"))]

// Only drafts
*[_type == "post" && _id in path("drafts.**")]
```

> **Note:** `useDocumentStore().listenQuery()` handles draft/published merging automatically — you typically don't need to filter manually.

---

## Optimistic Updates

For responsive UIs, update state immediately and reconcile with server:

```tsx
function useOptimisticList() {
  const client = useClient({apiVersion: '2024-01-01'})
  const [items, setItems] = useState<Item[]>([])
  const toast = useToast()

  const addItem = async (data: Partial<Item>) => {
    // Optimistic: add immediately with temp ID
    const tempId = \`temp-${Date.now()}\`
    const optimisticItem = {...data, _id: tempId, _type: 'item'} as Item
    setItems(prev => [optimisticItem, ...prev])

    try {
      const created = await client.create({_type: 'item', ...data})
      // Replace temp with real
      setItems(prev => prev.map(i => (i._id === tempId ? created : i)))
    } catch (err) {
      // Rollback on failure
      setItems(prev => prev.filter(i => i._id !== tempId))
      toast.push({status: 'error', title: 'Failed to create item'})
    }
  }

  const deleteItem = async (id: string) => {
    // Optimistic: remove immediately
    const backup = items.find(i => i._id === id)
    setItems(prev => prev.filter(i => i._id !== id))

    try {
      await client.delete(id)
    } catch (err) {
      // Rollback
      if (backup) setItems(prev => [...prev, backup])
      toast.push({status: 'error', title: 'Failed to delete item'})
    }
  }

  return {items, setItems, addItem, deleteItem}
}
```

---

## Polling Fallback

For cases where real-time isn't needed or as a fallback:

```tsx
function usePolledQuery<T>(query: string, intervalMs = 10000) {
  const client = useClient({ apiVersion: '2024-01-01' })
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      try {
        const result = await client.fetch<T>(query)
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      } catch (err) {
        console.error('Poll failed:', err)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, intervalMs)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [client, query, intervalMs])

  return { data, loading }
}
```

---

## Combining Listener with Initial Fetch

```tsx
function useLiveDocuments<T extends { _id: string }>(query: string) {
  const client = useClient({ apiVersion: '2024-01-01' })
  const [docs, setDocs] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial fetch
    client.fetch<T[]>(query).then((results) => {
      setDocs(results)
      setLoading(false)
    })

    // Subscribe to changes
    const sub = client
      .listen<T>(query, {}, { includeResult: true, visibility: 'query' })
      .subscribe((update) => {
        switch (update.transition) {
          case 'appear':
            setDocs((prev) => {
              // Avoid duplicates
              if (prev.some((d) => d._id === update.result?._id)) {
                return prev.map((d) => (d._id === update.result?._id ? (update.result as T) : d))
              }
              return [...prev, update.result as T]
            })
            break
          case 'disappear':
            setDocs((prev) => prev.filter((d) => d._id !== update.documentId))
            break
          case 'update':
            setDocs((prev) =>
              prev.map((d) => (d._id === update.documentId ? (update.result as T) : d)),
            )
            break
        }
      })

    return () => sub.unsubscribe()
  }, [client, query])

  return { docs, loading }
}
```

---

## Key Rules

1. **Always unsubscribe** — Return cleanup function from useEffect
2. **Always specify apiVersion** on useClient
3. **Prefer `useDocumentStore().listenQuery()`** inside Studio — it handles caching and draft merging
4. **Use `client.listen()`** for custom real-time logic or outside Studio context
5. **Filter drafts** when using raw client queries: `!(_id in path("drafts.**"))`
6. **Handle all three transitions** — appear, disappear, update
7. **Use `visibility: 'query'`** for consistent reads (default is 'transaction' which is faster but may be stale)

---

## Production Real-Time Patterns

The following patterns are sourced from Sanity's own production apps — **sanity-io/huey** (Media Library) and **sanity-io/canvas**.

### RxJS Listener → React Query Cache Patching (from Huey)

The production pattern for real-time updates with React Query:

```tsx
useEffect(() => {
  const sub = store.listen().subscribe(event => {
    if (event.transition === 'update') {
      // Surgically patch the cache — don't invalidate
      queryClient.setQueriesData(
        {predicate: ({queryKey}) => queryKey[0] === 'items'},
        (data) => ({
          ...data,
          pages: data.pages.map(page => ({
            ...page,
            results: page.results.map(item =>
              item._id === event.result._id ? {...item, ...event.result} : item
            ),
          })),
        }),
      )
    }
    if (event.transition === 'appear') {
      // New items: invalidate to refetch
      queryClient.invalidateQueries({queryKey: ['items']})
    }
    if (event.transition === 'disappear') {
      // Removed items: filter from cache
      queryClient.setQueriesData(...)
    }
  })
  return () => sub.unsubscribe()
}, [store, queryClient])
```

Key: patch cache surgically for updates/deletes, invalidate for new items.

### Listener Options (from Canvas)

```tsx
client.listen(query, params, {
  enableResume: true, // Auto-reconnect after network interruption
  events: ['mutation', 'reset', 'welcomeback'],
  includeResult: true,
  visibility: 'transaction', // Fire after transaction commits
})
```

Always subscribe AFTER initial fetch to avoid race conditions.

---

## Document Store Architecture

The document store is organized around **document pairs** (draft + published + version). All operations go through `documentStore.pair`:

```
documentStore.pair.editState(publishedId, typeName, version)
documentStore.pair.editOperations(publishedId, typeName, version)
documentStore.pair.validation(publishedId, typeName, requirePublishedRefs)
documentStore.pair.consistencyStatus(publishedId, typeName, version)
documentStore.pair.operationEvents(publishedId, typeName)
documentStore.pair.documentEvents(publishedId, typeName, version)
```

### EditStateFor Shape

```typescript
interface EditStateFor {
  id: string
  type: string
  draft: SanityDocument | null
  published: SanityDocument | null
  version: SanityDocument | null
  liveEdit: boolean
  ready: boolean
  transactionSyncLock: { enabled: boolean } | null
  release: string | undefined
}
```

### Key Internal Patterns

These are internal to Studio — understand them for debugging, don't use directly:

- **`exhaustMapWithTrailing`** — Prevents fetch pile-up while ensuring the latest event is always processed. Used throughout the document store to handle rapid mutations.
- **`publishReplay(1) + refCount()`** — Shares subscriptions across multiple consumers. A single document listener serves all components observing the same document.
- **SWR operator** — Stale-while-revalidate with LRU cache (max 50 entries). Returns cached data immediately while fetching fresh data in the background.
- **Observable memoization** — All document store observables are memoized by `(client, idPair, typeName)`. Requesting the same observable twice returns the same instance.
- **listenQuery internals** — Separates the listen query (SSE stream) from the fetch query (data retrieval). Throttles mutations to 1s intervals. Adds a 1.2s delay for mutations not yet visible at query consistency level.

---

## Presence System

- **PresenceScope** filters global presence data to path-relevant entries and trims the path prefix for nested components
- **useDocumentPresence** uses `startTransition` to defer the WebSocket connection (non-urgent update)
- **FieldPresence** registers with the overlay tracker for avatar positioning next to fields

---

## PatchEvent Bubbling

Nested inputs bubble patches up the form tree using `PatchEvent.prefixAll(segment)`:

```tsx
// Each level calls prefixAll with its path segment
// A deeply nested input's patch builds the full document path:
// Inner input: set('value')
// Parent array item: PatchEvent.prefixAll({_key: 'abc123'})
// Parent object: PatchEvent.prefixAll('myObject')
// Result: set('value', ['myObject', {_key: 'abc123'}, 'fieldName'])
```

---

## Connection State

`useConnectionState` watches `documentEvents` with a 200ms debounce before showing "reconnecting" status. This prevents flashing connection warnings on brief network hiccups.

---

## useObservableEvent

Converts a React event handler into an observable pipeline. Useful for debounced inputs:

```tsx
import {useObservableEvent} from 'sanity'
import {map, tap, debounce, of, timer} from 'rxjs'

const handleQueryChange = useObservableEvent(
  (event$: Observable<React.ChangeEvent<HTMLInputElement>>) =>
    event$.pipe(
      map(event => event.target.value),
      tap(setSearchInputValue),       // Update input immediately
      debounce(value => value === '' ? of('') : timer(300)), // Debounce non-empty
      tap(setSearchQuery),            // Trigger search after debounce
    )
)

// Usage
<TextInput onChange={handleQueryChange} />
```

---

## Performance Patterns

- **Partial + full list loading** — Load 50 items initially for fast render, then load full 2000 on demand
- **useShallowUnique / useUnique** — Memoize by shallow/deep equality to prevent unnecessary re-renders from new object references with identical data
- **startTransition for non-urgent updates** — Presence connections, background data syncs
- **React.lazy for code splitting** — Tools and inspectors loaded on demand, not at Studio boot
