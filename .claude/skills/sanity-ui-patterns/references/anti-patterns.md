# Anti-Patterns & Common Mistakes

## ❌ Custom CSS for Layout

**Wrong:**

```tsx
<div style={{ display: 'flex', gap: '16px', padding: '20px' }}>
  <div style={{ flex: 1 }}>Content</div>
</div>
```

**Right:**

```tsx
<Flex gap={4} padding={4}>
  <Box flex={1}>Content</Box>
</Flex>
```

**Why:** Sanity UI primitives handle theming, responsive behavior, and dark mode automatically. Custom CSS bypasses all of this.

---

## ❌ Raw HTML Elements for Layout

**Wrong:**

```tsx
<div>
  <h2>Title</h2>
  <p>Description</p>
  <div>
    <button onClick={handleClick}>Save</button>
  </div>
</div>
```

**Right:**

```tsx
<Stack space={3}>
  <Heading size={1} as="h2">
    Title
  </Heading>
  <Text>Description</Text>
  <Button text="Save" onClick={handleClick} />
</Stack>
```

**Why:** Raw HTML doesn't inherit theme colors, spacing, or typography. It will look broken in dark mode.

---

## ❌ Missing elementProps in Custom Inputs

**Wrong:**

```tsx
function MyInput(props: ObjectInputProps) {
  return <TextInput value={props.value?.title} onChange={handleChange} />
}
```

**Right:**

```tsx
function MyInput(props: ObjectInputProps) {
  const { elementProps, value, readOnly } = props
  return (
    <div {...elementProps}>
      <TextInput value={value?.title} onChange={handleChange} readOnly={readOnly} />
    </div>
  )
}
```

**Why:** `elementProps` contains `id`, `ref`, `onFocus`, `onBlur`, `aria-*` attributes required for Studio's focus tracking, validation, and accessibility. Without it, the field won't receive focus when clicked in the sidebar, validation errors won't scroll to it, and presence indicators won't work.

---

## ❌ Missing renderDefault Fallthrough

**Wrong:**

```tsx
form: {
  components: {
    input: (props) => {
      if (props.schemaType.name === 'myType') {
        return <MyCustomInput {...props} />
      }
      // Missing fallthrough! All other inputs are broken.
    },
  },
}
```

**Right:**

```tsx
form: {
  components: {
    input: (props) => {
      if (props.schemaType.name === 'myType') {
        return <MyCustomInput {...props} />
      }
      return props.renderDefault(props) // ALWAYS fall through
    },
  },
}
```

**Why:** Without `renderDefault`, every input type you don't handle will render nothing. The entire form breaks.

---

## ❌ Missing portal on Popover/Tooltip

**Wrong:**

```tsx
<Tooltip content={<Text>Help</Text>}>
  <Button icon={HelpCircleIcon} mode="bleed" />
</Tooltip>

<Popover content={<MyContent />} open={isOpen}>
  <Button text="Open" />
</Popover>
```

**Right:**

```tsx
<Tooltip content={<Text>Help</Text>} portal>
  <Button icon={HelpCircleIcon} mode="bleed" />
</Tooltip>

<Popover content={<MyContent />} open={isOpen} portal constrainSize animate>
  <Button text="Open" />
</Popover>
```

**Why:** Without `portal`, the popover/tooltip renders inline and gets clipped by any parent with `overflow: hidden` or `overflow: auto`. This is extremely common in Studio layouts.

---

## ❌ Missing apiVersion on useClient

**Wrong:**

```tsx
const client = useClient() // Error or deprecated behavior
```

**Right:**

```tsx
const client = useClient({ apiVersion: '2024-01-01' })
```

**Why:** Without `apiVersion`, the client uses a legacy API version with different query behavior. Always specify a recent date.

---

## ❌ Missing Listener Cleanup

**Wrong:**

```tsx
useEffect(() => {
  client.listen(\`*[_type == "post"]\`).subscribe(update => {
    handleUpdate(update)
  })
}, [])
```

**Right:**

```tsx
useEffect(() => {
  const sub = client.listen(\`*[_type == "post"]\`).subscribe(update => {
    handleUpdate(update)
  })
  return () => sub.unsubscribe()
}, [client])
```

**Why:** Without cleanup, subscriptions accumulate on every re-render, causing memory leaks and duplicate event handling.

---

## ❌ Dialog Component in Document Actions

**Wrong:**

```tsx
const MyAction: DocumentActionComponent = (props) => {
  const [open, setOpen] = useState(false)
  return {
    label: 'My Action',
    onHandle: () => setOpen(true),
    dialog: open && (
      <Dialog id="my-dialog" onClose={() => setOpen(false)} header="Title">
        <Text>Content</Text>
      </Dialog>
    ),
  }
}
```

**Right:**

```tsx
const MyAction: DocumentActionComponent = (props) => {
  const [open, setOpen] = useState(false)
  return {
    label: 'My Action',
    onHandle: () => setOpen(true),
    dialog: open && {
      type: 'dialog',
      onClose: () => setOpen(false),
      header: 'Title',
      content: <Text>Content</Text>,
    },
  }
}
```

**Why:** Document action dialogs use a **declarative object format**, not React components. Studio renders the dialog for you. Using `<Dialog>` directly will either not render or render incorrectly.

---

## ❌ Setting tone on Box

**Wrong:**

```tsx
<Box tone="critical" padding={3}>
  <Text>Error message</Text>
</Box>
```

**Right:**

```tsx
<Card tone="critical" padding={3} border radius={2}>
  <Text>Error message</Text>
</Card>
```

**Why:** Box is a colorless layout primitive. It ignores `tone`, `shadow`, `border`, and `scheme` props. Use Card when you need color/visual treatment.

---

## ❌ Missing PortalProvider in Tools

**Wrong:**

```tsx
function MyTool() {
  return (
    <Card height="fill">
      <Dialog id="d" onClose={close} header="Title">
        {/* Dialog renders in wrong location or not at all */}
      </Dialog>
    </Card>
  )
}
```

**Right:**

```tsx
function MyTool() {
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)
  return (
    <PortalProvider element={portalElement}>
      <Card ref={setPortalElement} display="flex" height="fill">
        <Dialog id="d" onClose={close} header="Title">
          {/* Dialog renders correctly */}
        </Dialog>
      </Card>
    </PortalProvider>
  )
}
```

**Why:** Tools render in an isolated container. Without PortalProvider, portaled elements (Dialog, Popover, Tooltip) render outside the tool's DOM tree and may be invisible or positioned incorrectly.

---

## ❌ Dialog Without onClose

**Wrong:**

```tsx
<Dialog id="my-dialog" header="Title">
  <Text>Content</Text>
</Dialog>
```

**Right:**

```tsx
<Dialog id="my-dialog" onClose={() => setOpen(false)} header="Title">
  <Text>Content</Text>
</Dialog>
```

**Why:** Without `onClose`, the dialog has no close button and no way to dismiss. The user is trapped.

---

## ❌ Replacing Arrays Instead of Appending

**Wrong:**

```tsx
export const myPlugin = definePlugin({
  name: 'my-plugin',
  tools: [myTool], // Replaces ALL tools from other plugins
})
```

**Right:**

```tsx
export const myPlugin = definePlugin({
  name: 'my-plugin',
  tools: (prev) => [...prev, myTool], // Appends to existing tools
})
```

**Why:** Using an array literal replaces the entire tools list, removing tools registered by other plugins (including the default desk tool). Always use the function form to append.

---

## ❌ Missing setIfMissing Before set

**Wrong:**

```tsx
onChange([set('value', ['myField'])])
```

**Right:**

```tsx
onChange([setIfMissing({ _type: schemaType.name }), set('value', ['myField'])])
```

**Why:** If the parent object doesn't exist yet, `set` on a nested path silently fails. `setIfMissing` ensures the parent object exists before setting fields.

---

## ❌ Not Respecting readOnly

**Wrong:**

```tsx
function MyInput(props: ObjectInputProps) {
  return <TextInput value={props.value?.title} onChange={handleChange} />
}
```

**Right:**

```tsx
function MyInput(props: ObjectInputProps) {
  return <TextInput value={props.value?.title} onChange={handleChange} readOnly={props.readOnly} />
}
```

**Why:** Studio sets `readOnly` based on permissions and document locking. Ignoring it lets users edit fields they shouldn't be able to change.

---

## ❌ Using 100vh for Full-Height Layouts

**Wrong:** `height: 100vh` — broken on mobile (browser chrome overlaps)

**Right:** `height: 100dvh` with `100vh` fallback

Both Huey and Canvas use `100dvh`.

---

## ❌ Missing min-width: 0 on Flex Children

**Wrong:** Flex children with long content overflow their container

**Right:** `> * { min-width: 0; }` on the flex parent, or `style={{minWidth: 0}}` on children

---

## ❌ Invalidating All Queries for Real-Time Updates

**Wrong:** `queryClient.invalidateQueries()` on every mutation event

**Right:** Surgically patch the React Query cache for updates/deletes, only invalidate for new items

---

## ❌ Showing Spinner Immediately

**Wrong:** `{isLoading && <Spinner />}` — causes flash for fast operations

**Right:** `<DelayedSpinner delay={750} />` — only shows after delay

---

## React 19 Anti-Patterns

### ❌ Using forwardRef (Deprecated)

```tsx
// ❌ Deprecated in React 19
const MyInput = forwardRef<HTMLInputElement, Props>((props, ref) => {
  return <input ref={ref} {...props} />
})

// ✅ ref as regular prop
function MyInput({ ref, ...props }: Props & { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />
}
```

### ❌ Creating Promises Inside Components for `use()`

```tsx
// ❌ Creates new promise every render → infinite suspend loop
function BadComponent() {
  const data = use(fetch('/api/data').then((r) => r.json()))
  return <Text>{data.title}</Text>
}

// ✅ Cache at module level or in state
const dataPromise = fetch('/api/data').then((r) => r.json())
function GoodComponent() {
  const data = use(dataPromise)
  return <Text>{data.title}</Text>
}
```

### ❌ Excessive useMemo/useCallback with React Compiler

```tsx
// ❌ Unnecessary with React Compiler
const handleClick = useCallback(() => doThing(id), [id])
const formatted = useMemo(() => format(data), [data])

// ✅ Just write plain code — compiler handles memoization
const handleClick = () => doThing(id)
const formatted = format(data)

// ✅ STILL use useMemo for observable creation and effect deps
const editState$ = useMemo(
  () => documentStore.pair.editState(publishedId, typeName),
  [documentStore, publishedId, typeName],
)
```

### ❌ useEffect for One-Time Data Fetching

```tsx
// ❌ Boilerplate-heavy, no Suspense integration
function OldPattern() {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch('/api')
      .then((r) => r.json())
      .then(setData)
  }, [])
  if (!data) return <Spinner />
  return <Text>{data.title}</Text>
}

// ✅ use() + Suspense for one-time fetches
const dataPromise = fetch('/api').then((r) => r.json())
function NewPattern() {
  const data = use(dataPromise)
  return <Text>{data.title}</Text>
}

// ⚠️ BUT: Keep useObservable for RxJS streams — use() doesn't work with observables
const editState$ = useMemo(() => documentStore.pair.editState(id, type), [documentStore, id, type])
const editState = useObservable(editState$)
```

### ❌ Manual Optimistic State

```tsx
// ❌ Manual rollback logic
const [likes, setLikes] = useState(serverLikes)
const handleLike = async () => {
  setLikes((prev) => prev + 1) // optimistic
  try {
    await api.like()
  } catch {
    setLikes(serverLikes)
  } // manual rollback
}

// ✅ useOptimistic handles revert automatically
const [optimisticLikes, setOptimisticLikes] = useOptimistic(serverLikes)
const handleLike = () => {
  startTransition(async () => {
    setOptimisticLikes((prev) => prev + 1)
    await api.like() // Reverts automatically on error
  })
}
```

### ❌ `<Context.Provider>`

```tsx
// ❌ Old pattern
<MyContext.Provider value={value}>
  <App />
</MyContext.Provider>

// ✅ React 19 — use Context directly as provider
<MyContext value={value}>
  <App />
</MyContext>
```

---

## Quick Checklist

Before shipping any Sanity UI code, verify:

- [ ] No custom CSS for layout (use Box/Flex/Stack/Grid)
- [ ] No raw HTML elements (use Text/Heading/Button/Card)
- [ ] `elementProps` spread in all custom inputs
- [ ] `renderDefault(props)` fallthrough in all form middleware
- [ ] `portal` prop on all Popover and Tooltip components
- [ ] `apiVersion` specified on all `useClient` calls
- [ ] All `client.listen()` subscriptions cleaned up in useEffect return
- [ ] Document action dialogs use object format, not `<Dialog>`
- [ ] Card (not Box) used for any colored/bordered surfaces
- [ ] PortalProvider wrapping tool components
- [ ] `onClose` handler on all Dialog components
- [ ] Arrays appended to (`prev => [...prev, item]`), not replaced
- [ ] `setIfMissing` before `set` on nested paths
- [ ] `readOnly` prop respected in custom inputs
- [ ] No forwardRef usage (use ref as prop)
- [ ] Promises passed to use() are stable (cached/module-level)
- [ ] useOptimistic used for optimistic updates (not manual state)
