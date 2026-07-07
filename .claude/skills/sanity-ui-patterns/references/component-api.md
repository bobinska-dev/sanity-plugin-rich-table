# Component API Reference

## Layout Primitives

### Box

Colorless layout wrapper. Use for spacing and structure.

| Prop         | Type                                           | Description                          |
| ------------ | ---------------------------------------------- | ------------------------------------ |
| `padding`    | `0-9 \| number[]`                              | Padding (responsive array supported) |
| `paddingX/Y` | `0-9 \| number[]`                              | Horizontal/vertical padding          |
| `margin`     | `0-9 \| number[]`                              | Margin (responsive array supported)  |
| `display`    | `'flex' \| 'block' \| 'grid' \| 'none' \| ...` | CSS display                          |
| `overflow`   | `'auto' \| 'hidden' \| 'visible'`              | Overflow behavior                    |
| `height`     | `'fill' \| 'stretch'`                          | Height mode                          |
| `flex`       | `number`                                       | Flex grow/shrink                     |
| `sizing`     | `'border' \| 'content'`                        | Box sizing                           |
| `column/row` | `number \| number[]`                           | Grid child placement                 |
| `as`         | `ElementType`                                  | Polymorphic element                  |

> **Note:** Box has NO tone, shadow, or border props. Use Card for those.

### Card

Extends Box with color, background, border, and shadow. The primary surface component.

| Prop       | Type                                                                               | Description                                   |
| ---------- | ---------------------------------------------------------------------------------- | --------------------------------------------- |
| `tone`     | `'default' \| 'transparent' \| 'primary' \| 'positive' \| 'caution' \| 'critical'` | Color tone                                    |
| `shadow`   | `0-5`                                                                              | Elevation shadow                              |
| `radius`   | `0-6`                                                                              | Border radius                                 |
| `border`   | `boolean`                                                                          | Show border                                   |
| `scheme`   | `'light' \| 'dark'`                                                                | Override color scheme for this subtree        |
| `selected` | `boolean`                                                                          | Selected state                                |
| `pressed`  | `boolean`                                                                          | Pressed state                                 |
| `as`       | `ElementType`                                                                      | Polymorphic (e.g., `as="a"` or `as="button"`) |

Plus all Box props (padding, margin, display, etc.)

### Flex

Flexbox container.

| Prop        | Type                                                                          | Description                       |
| ----------- | ----------------------------------------------------------------------------- | --------------------------------- |
| `direction` | `'row' \| 'column' \| 'row-reverse' \| 'column-reverse'`                      | Flex direction (responsive)       |
| `align`     | `'center' \| 'flex-start' \| 'flex-end' \| 'stretch' \| 'baseline'`           | Align items (responsive)          |
| `justify`   | `'center' \| 'flex-start' \| 'flex-end' \| 'space-between' \| 'space-around'` | Justify content (responsive)      |
| `wrap`      | `'wrap' \| 'nowrap' \| 'wrap-reverse'`                                        | Flex wrap (responsive)            |
| `gap`       | `0-9 \| number[]`                                                             | Gap between children (responsive) |

Plus all Box props.

### Stack

Vertical stacking with consistent spacing.

| Prop    | Type              | Description                     |
| ------- | ----------------- | ------------------------------- |
| `space` | `0-9 \| number[]` | Vertical space between children |

Plus all Box props.

### Grid

CSS Grid container.

| Prop        | Type                                                 | Description                    |
| ----------- | ---------------------------------------------------- | ------------------------------ |
| `columns`   | `number \| number[]`                                 | Number of columns (responsive) |
| `rows`      | `number \| number[]`                                 | Number of rows (responsive)    |
| `gap`       | `0-9 \| number[]`                                    | Gap between cells (responsive) |
| `gapX/gapY` | `0-9 \| number[]`                                    | Horizontal/vertical gap        |
| `autoRows`  | `'auto' \| 'min' \| 'max' \| 'fr'`                   | Auto row sizing                |
| `autoCols`  | `'auto' \| 'min' \| 'max' \| 'fr'`                   | Auto column sizing             |
| `autoFlow`  | `'row' \| 'column' \| 'row-dense' \| 'column-dense'` | Auto flow                      |

### Inline

Horizontal wrapping layout with consistent spacing.

| Prop    | Type              | Description         |
| ------- | ----------------- | ------------------- |
| `space` | `0-9 \| number[]` | Space between items |

### Container

Max-width constraint for content.

| Prop    | Type                    | Description                                                            |
| ------- | ----------------------- | ---------------------------------------------------------------------- |
| `width` | `0 \| 1 \| 2 \| 3 \| 4` | Max-width preset (0=auto, 1=640px, 2=960px, 3=1152px, 4=1536px approx) |

---

## Typography

### Text

Body text component.

| Prop           | Type                                            | Description                      |
| -------------- | ----------------------------------------------- | -------------------------------- |
| `size`         | `0-4`                                           | Font size (0=smallest)           |
| `weight`       | `'regular' \| 'medium' \| 'semibold' \| 'bold'` | Font weight                      |
| `muted`        | `boolean`                                       | Reduced opacity                  |
| `accent`       | `boolean`                                       | Accent color                     |
| `align`        | `'left' \| 'center' \| 'right'`                 | Text alignment                   |
| `textOverflow` | `'ellipsis'`                                    | Truncate with ellipsis           |
| `as`           | `ElementType`                                   | Semantic element (span, p, etc.) |

### Heading

Section headings.

| Prop     | Type                                            | Description              |
| -------- | ----------------------------------------------- | ------------------------ |
| `size`   | `0-5`                                           | Heading size             |
| `weight` | `'regular' \| 'medium' \| 'semibold' \| 'bold'` | Font weight              |
| `as`     | `ElementType`                                   | Semantic element (h1-h6) |
| `accent` | `boolean`                                       | Accent color             |
| `muted`  | `boolean`                                       | Reduced opacity          |

### Label

Small uppercase labels.

| Prop     | Type                                            | Description     |
| -------- | ----------------------------------------------- | --------------- |
| `size`   | `0-4`                                           | Label size      |
| `weight` | `'regular' \| 'medium' \| 'semibold' \| 'bold'` | Font weight     |
| `muted`  | `boolean`                                       | Reduced opacity |
| `accent` | `boolean`                                       | Accent color    |

### Code

Inline or block code.

| Prop       | Type     | Description                  |
| ---------- | -------- | ---------------------------- |
| `language` | `string` | Syntax highlighting language |
| `size`     | `0-4`    | Font size                    |
| `weight`   | `string` | Font weight                  |

---

## Form Components

### Button

```tsx
<Button text="Save" tone="primary" icon={CheckmarkIcon} mode="ghost" />
```

| Prop        | Type                                                              | Description                  |
| ----------- | ----------------------------------------------------------------- | ---------------------------- |
| `text`      | `string`                                                          | Button label                 |
| `icon`      | `ComponentType`                                                   | Left icon                    |
| `iconRight` | `ComponentType`                                                   | Right icon                   |
| `mode`      | `'default' \| 'ghost' \| 'bleed'`                                 | Visual mode                  |
| `tone`      | `'default' \| 'primary' \| 'positive' \| 'caution' \| 'critical'` | Color tone                   |
| `selected`  | `boolean`                                                         | Selected/active state        |
| `disabled`  | `boolean`                                                         | Disabled state               |
| `loading`   | `boolean`                                                         | Loading state                |
| `fontSize`  | `0-4`                                                             | Font size                    |
| `padding`   | `0-9`                                                             | Padding                      |
| `as`        | `ElementType`                                                     | Polymorphic (e.g., `as="a"`) |

### TextInput

```tsx
<TextInput
  value={val}
  onChange={(e) => setVal(e.currentTarget.value)}
  placeholder="Search..."
  icon={SearchIcon}
  clearButton
/>
```

| Prop             | Type                 | Description        |
| ---------------- | -------------------- | ------------------ |
| `value`          | `string`             | Input value        |
| `onChange`       | `ChangeEventHandler` | Change handler     |
| `placeholder`    | `string`             | Placeholder text   |
| `icon`           | `ComponentType`      | Left icon          |
| `iconRight`      | `ComponentType`      | Right icon         |
| `prefix`         | `ReactNode`          | Prefix element     |
| `suffix`         | `ReactNode`          | Suffix element     |
| `clearButton`    | `boolean`            | Show clear button  |
| `customValidity` | `string`             | Validation message |
| `fontSize`       | `0-4`                | Font size          |
| `padding`        | `0-9`                | Padding            |
| `radius`         | `0-6`                | Border radius      |
| `readOnly`       | `boolean`            | Read-only state    |

### TextArea

```tsx
<TextArea rows={5} value={val} onChange={(e) => setVal(e.currentTarget.value)} />
```

| Prop       | Type                 | Description            |
| ---------- | -------------------- | ---------------------- |
| `rows`     | `number`             | Number of visible rows |
| `value`    | `string`             | Textarea value         |
| `onChange` | `ChangeEventHandler` | Change handler         |
| `border`   | `boolean`            | Show border            |
| `radius`   | `0-6`                | Border radius          |
| `padding`  | `0-9`                | Padding                |
| `fontSize` | `0-4`                | Font size              |

### Select

```tsx
<Select fontSize={2} padding={3}>
  <option value="a">Option A</option>
  <option value="b">Option B</option>
</Select>
```

Standard HTML select with `fontSize`, `padding`, `radius` props.

### Checkbox / Switch

```tsx
<Checkbox checked={val} onChange={e => setVal(e.currentTarget.checked)} />
<Switch checked={val} onChange={e => setVal(e.currentTarget.checked)} />
```

Checkbox supports `indeterminate` prop.

### Autocomplete

```tsx
<Autocomplete
  id="my-autocomplete"
  options={options.map((o) => ({ value: o.id }))}
  renderOption={(option) => (
    <Card as="button" padding={3}>
      <Text>{option.value}</Text>
    </Card>
  )}
  renderValue={(value) => displayMap[value]}
  filterOption={(query, option) => option.value.toLowerCase().includes(query.toLowerCase())}
  onQueryChange={setQuery}
  loading={isLoading}
  placeholder="Search..."
/>
```

| Prop            | Type                         | Description                       |
| --------------- | ---------------------------- | --------------------------------- |
| `id`            | `string`                     | Required unique ID                |
| `options`       | `{value: string}[]`          | Options array                     |
| `renderOption`  | `(option) => ReactNode`      | Custom option renderer            |
| `renderValue`   | `(value) => string`          | Display value for selected option |
| `filterOption`  | `(query, option) => boolean` | Custom filter function            |
| `onQueryChange` | `(query) => void`            | Query change handler              |
| `loading`       | `boolean`                    | Loading state                     |

---

## Feedback Components

### Dialog

```tsx
<Dialog id="my-dialog" onClose={handleClose} header="Title" width={1} animate>
  <Box padding={4}>
    <Text>Dialog content</Text>
  </Box>
</Dialog>
```

| Prop       | Type                    | Description                        |
| ---------- | ----------------------- | ---------------------------------- |
| `id`       | `string`                | Required unique ID                 |
| `onClose`  | `() => void`            | **Required** — close handler       |
| `header`   | `string`                | Dialog title                       |
| `footer`   | `ReactNode`             | Footer content                     |
| `width`    | `0-4`                   | Max width preset                   |
| `animate`  | `boolean`               | Animate open/close                 |
| `position` | `'fixed' \| 'absolute'` | Positioning (use fixed for mobile) |

> **Mobile gotcha:** Studio sets absolute positioning on mobile. Use `style={{position: 'fixed'}}` if dialog is cut off.

### Popover

```tsx
<Popover content={<MyContent />} open={isOpen} placement="bottom" portal constrainSize animate>
  <Button text="Toggle" onClick={() => setOpen(!isOpen)} selected={isOpen} />
</Popover>
```

| Prop                 | Type                                            | Description                       |
| -------------------- | ----------------------------------------------- | --------------------------------- |
| `content`            | `ReactNode`                                     | Popover content                   |
| `open`               | `boolean`                                       | Controlled open state             |
| `placement`          | `'top' \| 'bottom' \| 'left' \| 'right' \| ...` | Placement                         |
| `portal`             | `boolean`                                       | **Always use** — render in portal |
| `constrainSize`      | `boolean`                                       | Constrain to viewport             |
| `preventOverflow`    | `boolean`                                       | Prevent overflow                  |
| `animate`            | `boolean`                                       | Animate open/close                |
| `fallbackPlacements` | `Placement[]`                                   | Fallback positions                |

### Tooltip

```tsx
<Tooltip content={<Text size={1}>Help text</Text>} placement="top" portal>
  <Button icon={HelpCircleIcon} mode="bleed" />
</Tooltip>
```

| Prop                 | Type          | Description                       |
| -------------------- | ------------- | --------------------------------- |
| `content`            | `ReactNode`   | Tooltip content                   |
| `placement`          | `Placement`   | Position                          |
| `portal`             | `boolean`     | **Always use** — render in portal |
| `animate`            | `boolean`     | Animate                           |
| `disabled`           | `boolean`     | Disable tooltip                   |
| `fallbackPlacements` | `Placement[]` | Fallback positions                |

### Toast (via useToast hook)

```tsx
const toast = useToast()
toast.push({
  status: 'success', // 'success' | 'error' | 'warning' | 'info'
  title: 'Document published',
  description: 'Optional details',
  duration: 5000,
})
```

### Badge

```tsx
<Badge tone="primary" fontSize={1}>
  New
</Badge>
```

| Prop       | Type                                                              | Description |
| ---------- | ----------------------------------------------------------------- | ----------- |
| `tone`     | `'default' \| 'primary' \| 'positive' \| 'caution' \| 'critical'` | Color tone  |
| `fontSize` | `0-4`                                                             | Font size   |

### Spinner

```tsx
<Spinner muted />
```

| Prop    | Type      | Description     |
| ------- | --------- | --------------- |
| `muted` | `boolean` | Reduced opacity |
| `size`  | `number`  | Spinner size    |

---

## Navigation Components

### Menu / MenuButton / MenuItem

```tsx
<MenuButton
  id="my-menu"
  button={<Button text="Options" mode="ghost" />}
  menu={
    <Menu>
      <MenuItem text="Edit" icon={EditIcon} onClick={handleEdit} />
      <MenuItem text="Delete" icon={TrashIcon} tone="critical" onClick={handleDelete} />
    </Menu>
  }
  placement="bottom-start"
/>
```

### Tab / TabList / TabPanel

```tsx
const [tab, setTab] = useState('overview')

<TabList space={1}>
  <Tab
    aria-controls="overview-panel"
    id="overview-tab"
    label="Overview"
    onClick={() => setTab('overview')}
    selected={tab === 'overview'}
  />
  <Tab
    aria-controls="details-panel"
    id="details-tab"
    label="Details"
    onClick={() => setTab('details')}
    selected={tab === 'details'}
  />
</TabList>

<TabPanel aria-labelledby="overview-tab" id="overview-panel" hidden={tab !== 'overview'}>
  <Text>Overview content</Text>
</TabPanel>
<TabPanel aria-labelledby="details-tab" id="details-panel" hidden={tab !== 'details'}>
  <Text>Details content</Text>
</TabPanel>
```

> **Accessibility:** `aria-controls` on Tab must match `id` on TabPanel. `aria-labelledby` on TabPanel must match `id` on Tab.

### Avatar

```tsx
<Avatar src={imageUrl} size={1} />
```

| Prop       | Type     | Description       |
| ---------- | -------- | ----------------- |
| `src`      | `string` | Image URL         |
| `size`     | `0-2`    | Avatar size       |
| `initials` | `string` | Fallback initials |
| `color`    | `string` | Background color  |

---

## Production Wrapper Patterns

The following patterns are sourced from Sanity's own production apps — **sanity-io/huey** (Media Library) and **sanity-io/canvas**.

### Wrapper Components for Consistent Defaults

Both Huey and Canvas wrap @sanity/ui primitives to enforce project-wide defaults:

```tsx
// Always animate, always portal, always constrainSize
function Popover(props: PopoverProps) {
  return <UIPopover {...props} animate portal constrainSize />
}

// MenuButton with consistent popover config
function MenuButton(props: MenuButtonProps) {
  return (
    <UIMenuButton
      {...props}
      popover={{
        placement: 'bottom-start',
        animate: true,
        constrainSize: true,
        portal: true,
        ...props.popover,
      }}
    />
  )
}
```

### `.attrs()` Pattern (styled-components)

Bake in @sanity/ui prop defaults to keep JSX clean:

```tsx
const HeaderCard = styled(Card).attrs({
  paddingX: 3,
  paddingY: 3,
})`
  border-bottom: 1px solid var(--card-border-color);
`
// Usage: <HeaderCard> instead of <Card paddingX={3} paddingY={3}>
```

### `Card as={Flex}` Pattern

Combine Card styling with Flex layout:

```tsx
<Card as={Flex} height="fill" overflow="hidden">
  {children}
</Card>
```

### Compound Component Pattern

For complex UI sections, export a namespace object:

```tsx
export const Sidebar = {
  Root: styled(Card).attrs({ height: 'fill', display: 'grid' })`...`,
  Inner: styled(Flex).attrs({ direction: 'column', flex: 1 })`
    overflow-y: auto;
  `,
  Footer: styled(Card).attrs({ paddingX: 3, paddingY: 4 })``,
}
// Usage: <Sidebar.Root><Sidebar.Inner>...</Sidebar.Inner></Sidebar.Root>
```

### Motion + @sanity/ui

```tsx
import { motion } from 'motion/react'
import { Card } from '@sanity/ui'
const MotionCard = motion.create(Card)
// Now supports all motion props + all Card props
```
