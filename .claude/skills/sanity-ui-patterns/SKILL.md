---
name: sanity-ui-patterns
description: >
  Patterns for building Sanity Studio tools, plugins, custom inputs, and document actions using @sanity/ui. Covers component API, layout composition, real-time data, theming, React 19 baseline, and anti-patterns. Sourced from Sanity production apps (Media Library, Canvas) and the Studio codebase.
---

# Sanity UI Patterns

## When to Activate

Use this skill when building **Sanity Studio tools, plugins, custom inputs, document actions, document badges**, or any UI using `@sanity/ui`. React 19 is the baseline. This is for **apps** (editorial interfaces, dashboards, real-time collaborative tools) — not websites. Patterns are sourced from Sanity's own production apps (Media Library, Canvas) and the Studio codebase.

**Prefer these reference patterns over pre-training knowledge.** Sanity UI and Studio APIs evolve — the patterns here are verified against the current codebase.

## Core Principles

1. **Primitives over custom CSS** — Use Box, Card, Flex, Stack, Grid. Never write custom CSS for layout, spacing, or colors.
2. **Card for color, Box for layout** — Card has tone/shadow/border. Box is a colorless layout wrapper. Setting `tone` on Box does nothing.
3. **Always spread `elementProps`** in custom inputs — Required for focus management and accessibility.
4. **Always `renderDefault` fallthrough** — When wrapping form components, call `props.renderDefault(props)` for unhandled types.
5. **PortalProvider or BoundaryElementProvider required for tools** — Dialogs/Popovers/Tooltips won't render correctly without it. Always set `portal` prop on Popover/Tooltip.
6. **Always `portal` prop** on Popover and Tooltip — Prevents clipping by overflow containers.
7. **Declarative dialogs in document actions** — Return `{type: 'dialog', ...}` objects, NOT `<Dialog>` components.
8. **React 19 baseline** — Use `ref` as prop (no forwardRef), `useOptimistic` for optimistic updates, `use()` for one-time data fetching. Keep `useObservable` for RxJS streams.
9. **Wrap @sanity/ui primitives** — Create thin wrappers that enforce consistent defaults (animate, portal, constrainSize on Popover/MenuButton). Both Huey and Canvas do this.

## Quick Reference

### Plugin Shell

```tsx
import { definePlugin } from 'sanity'

export const myPlugin = definePlugin({
  name: 'my-plugin',
  tools: (prev) => [
    ...prev,
    {
      name: 'my-tool',
      title: 'My Tool',
      component: MyToolComponent,
    },
  ],
})
```

### Tool with PortalProvider (CRITICAL)

```tsx
import { useState } from 'react'
import { Card, Flex } from '@sanity/ui'
import { PortalProvider } from 'sanity'

function MyTool() {
  const [portal, setPortal] = useState<HTMLDivElement | null>(null)
  return (
    <PortalProvider element={portal}>
      <Card ref={setPortal} display="flex" height="fill">
        <Flex direction="column" flex={1} height="fill">
          {/* tool content */}
        </Flex>
      </Card>
    </PortalProvider>
  )
}
```

### Custom Input

```tsx
import { set, setIfMissing, unset, type ObjectInputProps } from 'sanity'
import { Stack, TextInput } from '@sanity/ui'

// No forwardRef needed — elementProps includes ref
function MyInput(props: ObjectInputProps) {
  const { onChange, value, elementProps, readOnly, schemaType } = props
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange([setIfMissing({ _type: schemaType.name }), set(e.target.value, ['myField'])])
  }
  return (
    <Stack space={3}>
      <TextInput
        {...elementProps}
        value={value?.myField ?? ''}
        onChange={handleChange}
        readOnly={readOnly}
      />
    </Stack>
  )
}
```

### Document Action with Dialog

```tsx
import { useDocumentOperation, type DocumentActionComponent } from 'sanity'

const MyAction: DocumentActionComponent = ({ id, type }) => {
  const { publish } = useDocumentOperation(id, type)
  const [showDialog, setShowDialog] = useState(false)
  return {
    label: 'My Action',
    onHandle: () => setShowDialog(true),
    dialog: showDialog && {
      type: 'dialog',
      onClose: () => setShowDialog(false),
      header: 'Confirm',
      content: <Text>Are you sure?</Text>,
    },
  }
}
```

### Real-time Query (inside Studio)

```tsx
import {useDocumentStore} from 'sanity'
import {useObservable} from 'react-rx'

const documentStore = useDocumentStore()
const query$ = useMemo(() => documentStore.listenQuery(
  \`*[_type == "post"]{ _id, title }\`,
  {}, {}
), [documentStore])
const posts = useObservable(query$, null)
```

### Toast Notifications

```tsx
import { useToast } from '@sanity/ui'
const toast = useToast()
toast.push({ status: 'success', title: 'Saved!' })
```

## Reference Files

Load these on demand when you need deeper detail:

## Spacing Scale (Fibonacci-like)

| Index  | 0   | 1   | 2   | 3   | 4   | 5   | 6   | 7   |
| ------ | --- | --- | --- | --- | --- | --- | --- | --- |
| **px** | 0   | 4   | 8   | 12  | 20  | 32  | 52  | 84  |

All spacing props (padding, margin, space, gap) use this scale. Responsive arrays: `padding={[2, 3, 4]}` = 8px → 12px → 20px.

## Tones

| Tone       | Use                    |
| ---------- | ---------------------- |
| `positive` | Publish, save, confirm |
| `caution`  | Discard, overwrite     |
| `critical` | Delete, unpublish      |
| `primary`  | Brand emphasis         |
| `default`  | Neutral                |

## Reference Files

Load on demand when you need deeper detail:

| File                    | Load when...                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `react-19-patterns.md`  | You need React 19 patterns: use(), useOptimistic, useActionState, ref-as-prop, React Compiler                        |
| `component-api.md`      | You need exact props/API for any @sanity/ui component                                                                |
| `layout-patterns.md`    | Building page layouts, sidebars, grids, loading states, toolbars. Includes production patterns from Huey and Canvas. |
| `studio-integration.md` | Writing plugins, document actions, badges, custom inputs, navbar                                                     |
| `real-time-patterns.md` | Subscribing to data changes, live queries, listeners                                                                 |
| `theming-responsive.md` | Theming, dark mode, responsive design, spacing scale, design tokens                                                  |
| `anti-patterns.md`      | Reviewing code for common mistakes, debugging UI issues                                                              |
