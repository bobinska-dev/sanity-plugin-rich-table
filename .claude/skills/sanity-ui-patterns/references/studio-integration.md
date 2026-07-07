# Studio Integration

## definePlugin

The entry point for all Sanity Studio plugins:

```tsx
import { definePlugin } from 'sanity'

interface MyPluginOptions {
  apiKey?: string
  enableFeature?: boolean
}

export const myPlugin = definePlugin<MyPluginOptions>((options = {}) => ({
  name: 'my-plugin',

  // Register tools
  tools: (prev) => [
    ...prev,
    {
      name: 'my-tool',
      title: 'My Tool',
      icon: RocketIcon,
      component: MyToolComponent,
    },
  ],

  // Register document actions
  document: {
    actions: (prev, context) => {
      if (context.schemaType === 'post') {
        return [...prev, MyCustomAction]
      }
      return prev
    },
    badges: (prev, context) => {
      return [...prev, MyCustomBadge]
    },
  },

  // Override form components
  form: {
    components: {
      input: (props) => {
        if (props.schemaType.name === 'myCustomType') {
          return <MyCustomInput {...props} />
        }
        return props.renderDefault(props)
      },
    },
    // Add image asset sources
    image: {
      assetSources: (prev) => [...prev, myImageSource],
    },
  },

  // Override Studio chrome
  studio: {
    components: {
      layout: (props) => <MyProvider>{props.renderDefault(props)}</MyProvider>,
      navbar: (props) => {
        return props.renderDefault({
          ...props,
          // Can inject custom actions
        })
      },
    },
  },
}))
```

**Usage in sanity.config.ts:**

```tsx
import { defineConfig } from 'sanity'
import { myPlugin } from './plugins/my-plugin'

export default defineConfig({
  // ...
  plugins: [myPlugin({ enableFeature: true })],
})
```

> **CRITICAL:** Always append to arrays (`[...prev, myThing]`), never replace them. Replacing removes other plugins' contributions.

---

## Tool Registration

```tsx
import { type Tool } from 'sanity'

const myTool: Tool = {
  name: 'my-tool',
  title: 'My Tool',
  icon: RocketIcon,
  component: MyToolComponent,
  // Optional: custom router
  router: route.create('/', [route.create('/item/:id')]),
}
```

### Tool Component with PortalProvider

```tsx
import { useState } from 'react'
import { Card, Flex, Heading, Stack } from '@sanity/ui'
import { PortalProvider, type ToolComponentProps } from 'sanity'

function MyToolComponent(props: ToolComponentProps) {
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)

  return (
    <PortalProvider element={portalElement}>
      <Card ref={setPortalElement} display="flex" height="fill">
        <Flex direction="column" flex={1} height="fill">
          <Card padding={4} borderBottom>
            <Heading size={1}>My Tool</Heading>
          </Card>
          <Flex flex={1} overflow="auto" padding={4}>
            <Stack space={4}>{/* Tool content */}</Stack>
          </Flex>
        </Flex>
      </Card>
    </PortalProvider>
  )
}
```

---

## Document Actions

Document actions appear in the publish menu. They return a descriptor object.

```tsx
import { useState } from 'react'
import { useDocumentOperation, type DocumentActionComponent } from 'sanity'
import { Text, Stack, Button, Flex } from '@sanity/ui'

const ConfirmPublishAction: DocumentActionComponent = ({ id, type, onComplete }) => {
  const { publish } = useDocumentOperation(id, type)
  const [showDialog, setShowDialog] = useState(false)

  return {
    label: 'Publish with Confirmation',
    icon: PublishIcon,
    tone: 'positive',
    disabled: publish.disabled !== false,
    onHandle: () => {
      setShowDialog(true)
    },
    // DECLARATIVE dialog object — NOT a <Dialog> component
    dialog: showDialog && {
      type: 'dialog',
      onClose: () => {
        setShowDialog(false)
        onComplete()
      },
      header: 'Confirm Publication',
      content: (
        <Stack space={4} padding={4}>
          <Text>Are you sure you want to publish this document?</Text>
          <Flex gap={2} justify="flex-end">
            <Button
              text="Cancel"
              mode="ghost"
              onClick={() => {
                setShowDialog(false)
                onComplete()
              }}
            />
            <Button
              text="Publish"
              tone="positive"
              onClick={() => {
                publish.execute()
                setShowDialog(false)
                onComplete()
              }}
            />
          </Flex>
        </Stack>
      ),
    },
  }
}
```

### Dialog types in actions:

- `{type: 'dialog', onClose, header, content, footer}` — Modal dialog
- `{type: 'confirm', onCancel, onConfirm, message}` — Confirmation dialog
- `{type: 'popover', onClose, content}` — Popover dialog

> **CRITICAL:** The `dialog` property must be a plain object descriptor, NOT a React `<Dialog>` component. Studio renders the dialog for you.

---

## Document Badges

```tsx
import {type DocumentBadgeComponent} from 'sanity'

const WordCountBadge: DocumentBadgeComponent = ({draft, published}) => {
  const doc = draft || published
  if (!doc?.body) return null

  const wordCount = doc.body.split(/\s+/).length
  return {
    label: \`${wordCount} words\`,
    title: 'Word count',
    color: wordCount > 1000 ? 'warning' : 'default',
  }
}
```

Badge colors: `'primary' | 'success' | 'warning' | 'danger' | 'default'`

---

## Custom Inputs

### ObjectInputProps Pattern

```tsx
import { set, setIfMissing, unset, type ObjectInputProps, type PatchEvent } from 'sanity'
import { Stack, TextInput, Card, Text } from '@sanity/ui'

function LocationInput(props: ObjectInputProps) {
  const {
    onChange,
    value,
    elementProps,
    readOnly,
    schemaType,
    members,
    renderInput,
    renderField,
    renderItem,
    renderPreview,
  } = props

  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lat = parseFloat(e.currentTarget.value)
    if (isNaN(lat)) {
      onChange([unset(['lat'])])
    } else {
      onChange([setIfMissing({ _type: schemaType.name }), set(lat, ['lat'])])
    }
  }

  const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lng = parseFloat(e.currentTarget.value)
    if (isNaN(lng)) {
      onChange([unset(['lng'])])
    } else {
      onChange([setIfMissing({ _type: schemaType.name }), set(lng, ['lng'])])
    }
  }

  return (
    <Stack space={3}>
      {/* ALWAYS spread elementProps for focus management */}
      <div {...elementProps}>
        <Stack space={3}>
          <TextInput
            value={value?.lat?.toString() ?? ''}
            onChange={handleLatChange}
            placeholder="Latitude"
            readOnly={readOnly}
          />
          <TextInput
            value={value?.lng?.toString() ?? ''}
            onChange={handleLngChange}
            placeholder="Longitude"
            readOnly={readOnly}
          />
        </Stack>
      </div>
    </Stack>
  )
}
```

### Registering Custom Inputs

**Via schema:**

```tsx
defineType({
  name: 'location',
  type: 'object',
  components: {
    input: LocationInput,
  },
  fields: [
    { name: 'lat', type: 'number' },
    { name: 'lng', type: 'number' },
  ],
})
```

**Via plugin form middleware:**

```tsx
export const myPlugin = definePlugin({
  name: 'my-plugin',
  form: {
    components: {
      input: (props) => {
        if (props.schemaType.name === 'location') {
          return <LocationInput {...props} />
        }
        // ALWAYS fall through to renderDefault for unhandled types
        return props.renderDefault(props)
      },
    },
  },
})
```

---

## Studio Hooks

### useClient

```tsx
import {useClient} from 'sanity'

// ALWAYS specify apiVersion
const client = useClient({apiVersion: '2024-01-01'})
const data = await client.fetch(\`*[_type == "post"][0..9]\`)
```

### useDocumentStore + listenQuery

```tsx
import {useDocumentStore} from 'sanity'
import {useObservable} from 'react-rx'
import {useMemo} from 'react'

function useRealtimeQuery(query: string, params = {}) {
  const documentStore = useDocumentStore()
  const observable = useMemo(
    () => documentStore.listenQuery(query, params, {}),
    [documentStore, query, params]
  )
  return useObservable(observable, null)
}

// Usage
const posts = useRealtimeQuery(\`*[_type == "post"]{ _id, title }\`)
```

### useDocumentOperation

```tsx
import { useDocumentOperation } from 'sanity'

const { publish, patch, del, duplicate, restore } = useDocumentOperation(documentId, schemaType)

// Check if operation is possible
if (publish.disabled) {
  console.log('Cannot publish:', publish.disabled)
}

// Execute
publish.execute()
patch.execute([{ set: { title: 'New Title' } }])
del.execute()
```

### useDocumentPairPermissions

```tsx
import { useDocumentPairPermissions } from 'sanity'

const [permissions, loading] = useDocumentPairPermissions({
  id: documentId,
  type: schemaType,
  permission: 'publish', // 'create' | 'read' | 'update' | 'delete' | 'publish'
})

if (loading) return <Spinner />
if (!permissions?.granted) return <Text>No permission</Text>
```

### useRouter

```tsx
import { useRouter } from 'sanity/router'

const router = useRouter()

// Navigate
router.navigateUrl({ path: '/my-tool/item/abc123' })

// Get current state
const { tool, ...params } = router.state
```

### useColorSchemeValue

```tsx
import { useColorSchemeValue } from 'sanity'

const scheme = useColorSchemeValue() // 'light' | 'dark'
```

---

## Custom Navbar

```tsx
export const myPlugin = definePlugin({
  name: 'my-plugin',
  studio: {
    components: {
      navbar: (props) => {
        return (
          <Stack>
            {/* Custom banner above navbar */}
            <Card padding={2} tone="caution">
              <Flex align="center" justify="center">
                <Text size={1}>⚠️ Staging Environment</Text>
              </Flex>
            </Card>
            {/* Render the default navbar */}
            {props.renderDefault(props)}
          </Stack>
        )
      },
    },
  },
})
```
