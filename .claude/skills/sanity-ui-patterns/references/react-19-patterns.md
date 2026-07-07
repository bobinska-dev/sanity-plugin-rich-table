# React 19 Patterns

React 19 is the baseline for Sanity Studio. These patterns replace older React idioms.

## New APIs

### `use()` — Reading Promises and Context in Render

`use()` reads promises and context during render. Unlike hooks, it can be called conditionally.

```tsx
import { use, Suspense } from 'react'

// ✅ Module-level or cached promise — stable reference
const dataPromise = fetch('/api/config').then((r) => r.json())

function Config() {
  const config = use(dataPromise)
  return <Text>{config.siteName}</Text>
}

// ✅ Conditional context reading
function Field({ showPresence }: { showPresence: boolean }) {
  if (showPresence) {
    const presence = use(PresenceContext)
    return <FieldPresence presence={presence} />
  }
  return null
}

// Wrap in Suspense at the boundary
function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Config />
    </Suspense>
  )
}
```

> **⚠️ `use()` does NOT work with RxJS observables.** Use `useObservable` from `react-rx` for all observable streams. This is the primary data pattern in Studio.

### `useOptimistic` — Optimistic UI

Automatic revert on failure. Must call setter inside `startTransition`.

```tsx
import { useOptimistic, startTransition } from 'react'

function LikeButton({ likes, onLike }: { likes: number; onLike: () => Promise<void> }) {
  const [optimisticLikes, setOptimisticLikes] = useOptimistic(likes)

  const handleLike = () => {
    startTransition(async () => {
      setOptimisticLikes((prev) => prev + 1) // Immediate UI update
      await onLike() // If this throws, reverts automatically
    })
  }

  return <Button text={`${optimisticLikes} likes`} onClick={handleLike} />
}
```

**Reducer pattern** for complex state:

```tsx
type Action = { type: 'like' } | { type: 'bookmark' }
const [optimisticState, dispatch] = useOptimistic(serverState, (current, action: Action) => {
  switch (action.type) {
    case 'like':
      return { ...current, liked: true }
    case 'bookmark':
      return { ...current, bookmarked: true }
  }
})
```

### `useActionState` — Form Actions with Pending State

Sequential queuing — multiple submissions are processed in order.

```tsx
import { useActionState } from 'react'

type State = { error: string | null; success: boolean }

async function submitAction(prev: State, formData: FormData): Promise<State> {
  try {
    await saveDocument(formData.get('title') as string)
    return { error: null, success: true }
  } catch (e) {
    return { error: e.message, success: false } // Return errors, don't throw
  }
}

function CreateForm() {
  const [state, action, isPending] = useActionState(submitAction, { error: null, success: false })

  return (
    <form action={action}>
      <TextInput name="title" />
      {state.error && (
        <Card tone="critical">
          <Text>{state.error}</Text>
        </Card>
      )}
      <SubmitButton />
    </form>
  )
}
```

### `useFormStatus` — Must Be in Child Component

```tsx
import { useFormStatus } from 'react-dom'

// ✅ Child component — has access to parent form's status
function SubmitButton() {
  const { pending } = useFormStatus()
  return <Button text={pending ? 'Saving...' : 'Save'} type="submit" disabled={pending} />
}

// ❌ WRONG: useFormStatus in the form component itself returns {pending: false}
```

### `useTransition` / `startTransition` — Async Support

React 19 supports async functions in `startTransition`. Use alongside RxJS `debounceTime` — they solve different problems (render priority vs network throttling).

```tsx
import { useTransition } from 'react'

function SearchPane() {
  const [isPending, startTransition] = useTransition()

  const handleSearch = (query: string) => {
    startTransition(async () => {
      const results = await searchDocuments(query) // Non-blocking
      setResults(results)
    })
  }

  return (
    <Stack space={3}>
      <TextInput onChange={(e) => handleSearch(e.target.value)} />
      {isPending && <Spinner />}
      <ResultsList />
    </Stack>
  )
}
```

### `ref` as Regular Prop — No More `forwardRef`

`forwardRef` is deprecated. Destructure `ref` directly from props.

```tsx
// ✅ React 19
function MyInput({ ref, ...props }: { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />
}

// ❌ Deprecated
const MyInput = forwardRef<HTMLInputElement>((props, ref) => {
  return <input ref={ref} {...props} />
})
```

### `<Context>` as Provider

No more `.Provider` wrapper:

```tsx
const ThemeContext = createContext<Theme>(defaultTheme)

// ✅ React 19
<ThemeContext value={theme}>
  <App />
</ThemeContext>

// ❌ Old pattern
<ThemeContext.Provider value={theme}>
  <App />
</ThemeContext.Provider>
```

### `<Activity>` (React 19.2) — Preserve State When Hidden

Unlike conditional rendering, `<Activity>` preserves state and DOM when hidden. Ideal for Studio panes.

```tsx
import { Activity } from 'react'

function StudioLayout({ activePane }: { activePane: string }) {
  return (
    <Flex>
      <Activity mode={activePane === 'editor' ? 'visible' : 'hidden'}>
        <EditorPane /> {/* State preserved when hidden */}
      </Activity>
      <Activity mode={activePane === 'preview' ? 'visible' : 'hidden'}>
        <PreviewPane /> {/* No re-mount when switching back */}
      </Activity>
    </Flex>
  )
}
```

### Ref Cleanup Functions

Return a cleanup function from ref callbacks. Replaces `useRef` + `useEffect` for DOM setup.

```tsx
function VideoPlayer({ src }: { src: string }) {
  return (
    <video
      ref={(el) => {
        if (!el) return
        const observer = new IntersectionObserver(([entry]) => {
          entry.isIntersecting ? el.play() : el.pause()
        })
        observer.observe(el)
        return () => observer.disconnect() // Cleanup!
      }}
      src={src}
    />
  )
}
```

### `<form>` Actions

Pass async functions directly to the `action` prop:

```tsx
<form
  action={async (formData: FormData) => {
    const title = formData.get('title') as string
    await client.create({ _type: 'post', title })
  }}
>
  <TextInput name="title" />
  <SubmitButton />
</form>
```

---

## React Compiler

The React Compiler auto-memoizes components and hooks, eliminating most manual `useMemo`/`useCallback`.

### When to still use manual memoization:

```tsx
// ✅ Keep useMemo for observable creation (critical for RxJS)
const editState$ = useMemo(
  () => documentStore.pair.editState(publishedId, typeName),
  [documentStore, publishedId, typeName],
)
const editState = useObservable(editState$)

// ✅ Keep useMemo for effect dependencies that need referential stability
const config = useMemo(() => ({ apiVersion, dataset }), [apiVersion, dataset])
useEffect(() => setupClient(config), [config])
```

### For new code:

- **Rely on the compiler** — don't add `useMemo`/`useCallback` by default
- **Only add manual memoization** when you observe performance issues or need stability for effects/observables
- The compiler understands React rules and memoizes at a granular level

---

## Sanity Studio-Specific Patterns

### Custom Inputs — No forwardRef Needed

`elementProps` already includes `ref`. Just spread it:

```tsx
function MyInput(props: StringInputProps) {
  const { elementProps, value, onChange, readOnly, schemaType } = props
  // elementProps has: id, ref, onFocus, onBlur, aria-*
  return (
    <TextInput
      {...elementProps}
      value={value ?? ''}
      onChange={(e) => onChange(set(e.target.value))}
      readOnly={readOnly}
    />
  )
}
```

### useOptimistic in Custom Inputs

```tsx
function ToggleInput(props: BooleanInputProps) {
  const { value, onChange } = props
  const [optimisticValue, setOptimisticValue] = useOptimistic(value ?? false)

  const handleToggle = () => {
    startTransition(async () => {
      setOptimisticValue(!optimisticValue)
      onChange(set(!value))
    })
  }

  return <Switch checked={optimisticValue} onChange={handleToggle} />
}
```

### useObservable Still Required for RxJS

`use()` does not work with RxJS observables. Continue using `useObservable`:

```tsx
// ✅ Correct pattern for real-time data in Studio
const documentStore = useDocumentStore()
const editState$ = useMemo(
  () => documentStore.pair.editState(publishedId, typeName),
  [documentStore, publishedId, typeName],
)
const editState = useObservable(editState$)
```

### Plugin peerDependencies

```json
{
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "sanity": "^3.x.x"
  }
}
```

### Error Boundaries

Error boundaries catch errors from `startTransition` async functions:

```tsx
<ErrorBoundary
  fallback={
    <Card tone="critical">
      <Text>Something went wrong</Text>
    </Card>
  }
>
  <AsyncComponent /> {/* Errors in startTransition caught here */}
</ErrorBoundary>
```

---

## TypeScript Patterns

```tsx
// Ref typing — use React.Ref, not React.RefObject
interface MyComponentProps {
  ref?: React.Ref<HTMLDivElement>
  children: React.ReactNode
}

// useActionState typing
const [state, action, isPending] = useActionState<{ error: string | null }, FormData>(
  submitAction,
  { error: null },
)

// useOptimistic — simple
const [optimistic, setOptimistic] = useOptimistic<number>(serverCount)

// useOptimistic — with reducer
const [optimistic, dispatch] = useOptimistic<State, Action>(serverState, (current, action) => ({
  ...current,
  ...action,
}))

// Ref callback cleanup return type
const refCallback = (el: HTMLElement | null): (() => void) | void => {
  if (!el) return
  const cleanup = setupElement(el)
  return cleanup
}
```

---

## Anti-Patterns

| ❌ Don't                                 | ✅ Do                             |
| ---------------------------------------- | --------------------------------- |
| `forwardRef`                             | `ref` as prop                     |
| Create promises in render for `use()`    | Cache at module level or in state |
| `useFormStatus` in form component        | Put in child component            |
| Manual optimistic state management       | `useOptimistic`                   |
| `useEffect` for one-time fetch           | `use()` + Suspense                |
| `useObservable` replacement with `use()` | Keep `useObservable` for RxJS     |
| `<Context.Provider>`                     | `<Context value={...}>`           |
| Excessive `useMemo`/`useCallback`        | Trust React Compiler              |
