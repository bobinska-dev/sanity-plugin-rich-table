# Theming & Responsive Design

## Spacing Scale

Sanity UI uses a Fibonacci-based spacing scale (0-9):

| Value | Pixels | Common Use               |
| ----- | ------ | ------------------------ |
| 0     | 0px    | No spacing               |
| 1     | 4px    | Tight spacing, icon gaps |
| 2     | 8px    | Compact padding          |
| 3     | 12px   | Default small padding    |
| 4     | 20px   | Standard padding         |
| 5     | 32px   | Section spacing          |
| 6     | 52px   | Large section spacing    |
| 7     | 84px   | Page-level spacing       |
| 8     | 136px  | Hero spacing             |
| 9     | 220px  | Maximum spacing          |

Used in: `padding`, `margin`, `space`, `gap` props.

---

## Responsive Array Syntax

Most layout props accept mobile-first responsive arrays:

```tsx
// [mobile, tablet, desktop, wide]
<Box padding={[3, 3, 4, 5]} />
<Grid columns={[1, 1, 2, 3]} gap={[3, 3, 4]} />
<Flex direction={['column', 'column', 'row']} />
```

Breakpoints (approximate):

- Index 0: 0px+ (mobile)
- Index 1: 512px+ (small tablet)
- Index 2: 768px+ (tablet/desktop)
- Index 3: 1024px+ (wide desktop)
- Index 4: 1280px+ (extra wide)

### useMediaIndex

Get the current breakpoint index programmatically:

```tsx
import { useMediaIndex } from '@sanity/ui'

function ResponsiveComponent() {
  const mediaIndex = useMediaIndex()

  // 0 = mobile, 1 = small tablet, 2 = desktop, etc.
  const isMobile = mediaIndex < 2
  const isDesktop = mediaIndex >= 2

  return (
    <Flex direction={isMobile ? 'column' : 'row'}>
      {isDesktop && <Sidebar />}
      <MainContent />
    </Flex>
  )
}
```

---

## Tones

Tones control the color palette of Card, Button, Badge, and other components:

| Tone          | Use For                             |
| ------------- | ----------------------------------- |
| `default`     | Standard UI elements                |
| `transparent` | Overlay/ghost elements              |
| `primary`     | Primary actions, selected states    |
| `positive`    | Success, publish, create            |
| `caution`     | Warnings, draft states              |
| `critical`    | Errors, delete, destructive actions |

```tsx
<Card tone="caution" padding={3} border radius={2}>
  <Text>This document has unsaved changes</Text>
</Card>

<Button text="Delete" tone="critical" icon={TrashIcon} />
<Badge tone="positive">Published</Badge>
```

---

## Color Scheme Override

Force a subtree to use light or dark mode regardless of the global setting:

```tsx
// Force dark mode for this card and all children
<Card scheme="dark" padding={4} radius={2}>
  <Text>Always dark</Text>
</Card>

// Force light mode
<Card scheme="light" padding={4} radius={2}>
  <Text>Always light</Text>
</Card>
```

### useColorSchemeValue (Studio)

```tsx
import { useColorSchemeValue } from 'sanity'

const scheme = useColorSchemeValue() // 'light' | 'dark'
```

### usePrefersDark (System preference)

```tsx
import { usePrefersDark } from '@sanity/ui'

const prefersDark = usePrefersDark() // boolean
```

---

## ThemeProvider & Custom Themes

### Using Studio's Theme

Inside Studio, the theme is already provided. For standalone apps:

```tsx
import { ThemeProvider, studioTheme } from '@sanity/ui'

function App() {
  return (
    <ThemeProvider theme={studioTheme}>
      <Card padding={4}>
        <Text>Themed content</Text>
      </Card>
    </ThemeProvider>
  )
}
```

### Custom Theme with buildTheme

```tsx
import {buildTheme} from '@sanity/ui'

const myTheme = buildTheme({
  // Override specific tokens
  fonts: {
    text: {family: 'Inter, sans-serif'},
    heading: {family: 'Inter, sans-serif'},
    code: {family: 'JetBrains Mono, monospace'},
  },
})

<ThemeProvider theme={myTheme}>
  {/* ... */}
</ThemeProvider>
```

---

## useTheme — Design Tokens

Access raw theme values for custom styling:

```tsx
import {useTheme} from '@sanity/ui'

function CustomComponent() {
  const {sanity} = useTheme()

  // Color tokens
  const borderColor = sanity.color.input.default.enabled.border
  const fgColor = sanity.color.base.fg
  const bgColor = sanity.color.base.bg

  // Font tokens
  const fontSize = sanity.fonts.text.sizes[1]?.fontSize
  const lineHeight = sanity.fonts.text.sizes[1]?.lineHeight

  // Space tokens
  const space4 = sanity.space[4] // 20

  return (
    <div style={{
      border: \`1px solid ${borderColor}\`,
      color: fgColor,
      fontSize,
      padding: space4,
    }}>
      Custom styled content
    </div>
  )
}
```

---

## CSS Custom Properties

When you must use custom CSS (rare), use CSS custom properties for theme awareness:

```css
.my-custom-element {
  border: 1px solid var(--card-border-color);
  background: var(--card-bg-color);
  color: var(--card-fg-color);
}
```

Available properties:
| Property | Description |
|----------|-------------|
| `--card-bg-color` | Card background color |
| `--card-fg-color` | Card foreground/text color |
| `--card-border-color` | Card border color |
| `--card-focus-ring-color` | Focus ring color |
| `--card-shadow-outline-color` | Shadow outline color |
| `--card-shadow-umbra-color` | Shadow umbra color |
| `--card-shadow-penumbra-color` | Shadow penumbra color |
| `--card-shadow-ambient-color` | Shadow ambient color |

These update automatically when tone or scheme changes on parent Cards.

---

## Practical Examples

### Theme-Aware Custom Visualization

```tsx
function ProgressBar({value}: {value: number}) {
  const {sanity} = useTheme()

  return (
    <Card border radius={6} overflow="hidden">
      <div
        style={{
          height: 8,
          width: \`${Math.min(100, Math.max(0, value))}%\`,
          backgroundColor: sanity.color.base.fg,
          opacity: 0.6,
          transition: 'width 200ms ease',
        }}
      />
    </Card>
  )
}
```

### Responsive Dashboard

```tsx
function Dashboard() {
  const mediaIndex = useMediaIndex()

  return (
    <Box padding={[3, 3, 4, 5]}>
      <Container width={3}>
        <Stack space={[4, 4, 5]}>
          <Heading size={[1, 1, 2]}>Dashboard</Heading>
          <Grid columns={[1, 2, 3, 4]} gap={[3, 3, 4]}>
            {stats.map((stat) => (
              <Card key={stat.id} tone={stat.tone} padding={[3, 3, 4]} border radius={2}>
                <Stack space={2}>
                  <Label size={0} muted>
                    {stat.label}
                  </Label>
                  <Heading size={[2, 2, 3]}>{stat.value}</Heading>
                </Stack>
              </Card>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Box>
  )
}
```
