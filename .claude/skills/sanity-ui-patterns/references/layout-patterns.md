# Layout Patterns

## Full-Height Tool Layout

The standard pattern for a Studio tool that fills the available viewport:

```tsx
import { useState } from 'react'
import { Card, Flex } from '@sanity/ui'
import { PortalProvider } from 'sanity'

function MyTool() {
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)

  return (
    <PortalProvider element={portalElement}>
      <Card ref={setPortalElement} display="flex" height="fill">
        <Flex direction="column" flex={1} height="fill">
          {/* Header */}
          <Card padding={4} borderBottom>
            <Heading size={1}>My Tool</Heading>
          </Card>

          {/* Scrollable content */}
          <Flex flex={1} overflow="auto" padding={4}>
            <Container width={1}>
              <Stack space={4}>{/* content */}</Stack>
            </Container>
          </Flex>
        </Flex>
      </Card>
    </PortalProvider>
  )
}
```

**Key points:**

- `PortalProvider` is **required** for Dialogs, Popovers, and Tooltips to render correctly inside tools
- `Card ref={setPortalElement}` creates the portal target
- `height="fill"` on the outer Card fills the tool area
- `Flex direction="column" flex={1}` creates the vertical layout
- `overflow="auto"` on the content area enables scrolling

---

## Sidebar + Main Layout

```tsx
function SidebarLayout() {
  return (
    <Flex height="fill">
      {/* Sidebar */}
      <Card borderRight padding={3} style={{ width: 280, minWidth: 280 }} overflow="auto">
        <Stack space={2}>
          <Label size={0} muted>
            Navigation
          </Label>
          {items.map((item) => (
            <Card
              key={item.id}
              as="button"
              padding={3}
              radius={2}
              selected={item.id === selectedId}
              onClick={() => setSelectedId(item.id)}
              tone={item.id === selectedId ? 'primary' : 'default'}
            >
              <Text size={1}>{item.title}</Text>
            </Card>
          ))}
        </Stack>
      </Card>

      {/* Main content */}
      <Flex flex={1} direction="column" overflow="auto">
        <Box padding={4}>
          <Container width={2}>{/* main content */}</Container>
        </Box>
      </Flex>
    </Flex>
  )
}
```

---

## Responsive Sidebar (collapses on mobile)

```tsx
import { useMediaIndex } from '@sanity/ui'

function ResponsiveSidebar() {
  const mediaIndex = useMediaIndex()
  const isMobile = mediaIndex < 2

  return (
    <Flex direction={isMobile ? 'column' : 'row'} height="fill">
      {!isMobile && (
        <Card borderRight padding={3} style={{ width: 280 }}>
          <SidebarContent />
        </Card>
      )}
      <Flex flex={1} direction="column" overflow="auto">
        <MainContent />
      </Flex>
    </Flex>
  )
}
```

---

## Responsive Grid

```tsx
<Grid columns={[1, 1, 2, 3]} gap={[3, 3, 4]} padding={4}>
  {items.map((item) => (
    <Card key={item.id} border radius={2} padding={4}>
      <Stack space={3}>
        <Heading size={0}>{item.title}</Heading>
        <Text size={1} muted>
          {item.description}
        </Text>
      </Stack>
    </Card>
  ))}
</Grid>
```

The array syntax is mobile-first: `[mobile, tablet, desktop, wide]`.

---

## Loading / Error / Content States

```tsx
function DataView({ data, error, loading }: Props) {
  if (loading) {
    return (
      <Flex align="center" justify="center" height="fill" padding={5}>
        <Spinner muted />
      </Flex>
    )
  }

  if (error) {
    return (
      <Card tone="critical" padding={4} radius={2} border>
        <Stack space={3}>
          <Text weight="semibold">Error loading data</Text>
          <Text size={1} muted>
            {error.message}
          </Text>
          <Button text="Retry" tone="critical" mode="ghost" onClick={onRetry} />
        </Stack>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Flex align="center" justify="center" height="fill" padding={5}>
        <Stack space={3} style={{ textAlign: 'center' }}>
          <Text size={2} muted>
            No items found
          </Text>
          <Button text="Create new" tone="primary" onClick={onCreate} />
        </Stack>
      </Flex>
    )
  }

  return <ContentList data={data} />
}
```

---

## Dialog with Footer Actions

```tsx
<Dialog
  id="confirm-dialog"
  onClose={handleClose}
  header="Confirm Action"
  width={1}
  animate
  footer={
    <Flex padding={3} justify="flex-end" gap={2}>
      <Button text="Cancel" mode="ghost" onClick={handleClose} />
      <Button text="Confirm" tone="primary" onClick={handleConfirm} />
    </Flex>
  }
>
  <Box padding={4}>
    <Text>Are you sure you want to proceed?</Text>
  </Box>
</Dialog>
```

---

## Card Grid (Dashboard Style)

```tsx
function Dashboard() {
  return (
    <Box padding={4}>
      <Container width={3}>
        <Stack space={5}>
          <Heading size={2}>Dashboard</Heading>

          {/* Stats row */}
          <Grid columns={[1, 2, 4]} gap={3}>
            <StatCard label="Documents" value={142} tone="primary" />
            <StatCard label="Published" value={98} tone="positive" />
            <StatCard label="Drafts" value={44} tone="caution" />
            <StatCard label="Errors" value={3} tone="critical" />
          </Grid>

          {/* Content area */}
          <Grid columns={[1, 1, 2]} gap={4}>
            <Card border radius={2} padding={4}>
              <Stack space={3}>
                <Heading size={0}>Recent Activity</Heading>
                {/* activity list */}
              </Stack>
            </Card>
            <Card border radius={2} padding={4}>
              <Stack space={3}>
                <Heading size={0}>Quick Actions</Heading>
                {/* action buttons */}
              </Stack>
            </Card>
          </Grid>
        </Stack>
      </Container>
    </Box>
  )
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: CardTone }) {
  return (
    <Card tone={tone} padding={4} radius={2} border>
      <Stack space={2}>
        <Label size={0} muted>
          {label}
        </Label>
        <Heading size={3}>{value}</Heading>
      </Stack>
    </Card>
  )
}
```

---

## Toolbar Pattern

```tsx
<Card borderBottom padding={2}>
  <Flex align="center" gap={2}>
    <Flex flex={1} gap={2}>
      <TextInput
        icon={SearchIcon}
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        clearButton
      />
    </Flex>
    <Flex gap={1}>
      <Tooltip content={<Text size={1}>Refresh</Text>} portal>
        <Button icon={RefreshIcon} mode="bleed" onClick={onRefresh} />
      </Tooltip>
      <MenuButton
        id="filter-menu"
        button={<Button icon={FilterIcon} mode="bleed" text="Filter" />}
        menu={
          <Menu>
            <MenuItem text="All" onClick={() => setFilter('all')} />
            <MenuItem text="Published" onClick={() => setFilter('published')} />
            <MenuItem text="Drafts" onClick={() => setFilter('drafts')} />
          </Menu>
        }
      />
    </Flex>
  </Flex>
</Card>
```

---

## Inline Detail / Split View

```tsx
function SplitView() {
  return (
    <Flex height="fill">
      {/* List */}
      <Card borderRight style={{ width: '40%' }} overflow="auto">
        <Stack>
          {items.map((item) => (
            <Card
              key={item._id}
              as="button"
              padding={3}
              borderBottom
              selected={item._id === selectedId}
              onClick={() => setSelectedId(item._id)}
            >
              <Stack space={2}>
                <Text weight="semibold" textOverflow="ellipsis">
                  {item.title}
                </Text>
                <Text size={1} muted textOverflow="ellipsis">
                  {item.subtitle}
                </Text>
              </Stack>
            </Card>
          ))}
        </Stack>
      </Card>

      {/* Detail */}
      <Flex flex={1} overflow="auto" padding={4}>
        {selectedId ? (
          <DetailView id={selectedId} />
        ) : (
          <Flex align="center" justify="center" flex={1}>
            <Text muted>Select an item</Text>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
```

---

## Production Patterns (from Huey & Canvas)

The following patterns are sourced from Sanity's own production apps — **sanity-io/huey** (Media Library) and **sanity-io/canvas**. These are authoritative.

### Full-Height Tool Layout (Production Pattern)

Both Huey and Canvas use the same core pattern:

```tsx
// Outer: Flex column fills viewport
<Flex direction="column" flex={1} style={{ height: '100dvh' }}>
  {/* Sticky header — flexShrink: 0 prevents compression */}
  <Card style={{ flexShrink: 0 }}>
    <Flex align="center" padding={2}>
      {/* header content */}
    </Flex>
  </Card>

  {/* Scrollable content area */}
  <Flex flex={1} style={{ overflow: 'auto' }}>
    {/* main content */}
  </Flex>
</Flex>
```

Key: use `100dvh` not `100vh` (mobile browser chrome). Use `flexShrink: 0` on headers.

### Sidebar + Main + Right Panel

Both apps use resizable panels. The pattern:

- Left nav panel (collapsible, starts collapsed on narrow viewports)
- Main content (flex: 1)
- Right sidebar (collapsible, context-dependent)
- On narrow viewports: panels become overlays or hide entirely

### Flex Overflow Prevention

Critical CSS pattern from Huey:

```tsx
const Container = styled(Flex)`
  > * {
    min-width: 0;
  } /* Prevents flex children from overflowing */
`
```

### Toolbar/Action Bar Pattern (from Canvas)

```tsx
<Flex align="center" flex={1} justify="space-between">
  {/* LHS: breadcrumb/title */}
  <Flex align="center" gap={2}>
    ...
  </Flex>
  {/* RHS: action buttons — flexShrink: 0 prevents shrinking */}
  <Flex align="center" gap={1} style={{ flexShrink: 0 }}>
    ...
  </Flex>
</Flex>
```

Use `gap={1}` between icon buttons, `gap={2}` between button groups.

### Empty State Pattern

```tsx
<Flex align="center" direction="column" flex={1} gap={4} justify="center" padding={4}>
  <Text align="center" size={2} weight="medium">
    No results found
  </Text>
  <Text align="center" muted size={1}>
    Try adjusting your search or filters
  </Text>
  <Button text="Reset filters" mode="ghost" onClick={onReset} />
</Flex>
```

### Delayed Loading Spinner

Both apps delay spinner display to avoid flash for fast operations:

```tsx
function DelayedSpinner({ delay = 1000 }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const timeout = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timeout)
  }, [delay])
  if (!visible) return null
  return <Spinner muted />
}
```
