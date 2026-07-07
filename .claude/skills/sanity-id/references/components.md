# Sanity ID Component Reference

Complete documentation for all 23 components in the Sanity ID design system.

## Button

Primary interactive element with multiple modes and sizes.

```tsx
import { Button } from "@sanity/sanity-id/components/button"

// Props
type ButtonProps<E extends ElementType> = {
  as?: E
  iconLeft?: IconSymbol | ReactElement
  iconRight?: IconSymbol | ReactElement
  mode?: "primary" | "brand" | "accent" | "muted" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
}

// Examples
<Button>Default Button</Button>
<Button mode="primary" size="lg">Large Primary</Button>
<Button mode="accent" iconLeft="add-circle">Add Item</Button>
<Button as={Link} href="/docs">Documentation</Button>
```

## IconButton

Icon-only button variant for compact interactions.

```tsx
import { IconButton } from "@sanity/sanity-id/components/icon-button"

// Props
type IconButtonProps<E extends ElementType> = {
  as?: E
  icon: IconSymbol | ReactElement
  mode?: "primary" | "brand" | "accent" | "muted" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
}

// Examples
<IconButton icon="close" aria-label="Close" />
<IconButton icon="settings" mode="ghost" size="sm" />
```

## Badge

Status indicators with optional icons.

```tsx
import { Badge } from "@sanity/sanity-id/components/badge"

// Props
type BadgeProps = {
  children?: ReactNode
  className?: string
  size?: "sm" | "md"
  icon?: IconSymbol
}

// Examples
<Badge>New</Badge>
<Badge size="sm" icon="check">Verified</Badge>
<Badge icon="warning-outline">Beta</Badge>
```

## Card

Content container with padding and border.

```tsx
import { Card } from "@sanity/sanity-id/components/card"

// Props
type CardProps<E extends ElementType> = {
  as?: E
  mode?: "dim" | "outline"
  size?: "sm" | "md" | "lg"
}

// Examples
<Card>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>

<Card mode="outline" size="lg">
  <p>Large outlined card</p>
</Card>
```

## Input

Text input field with label, hint, and error support.

```tsx
import { Input } from "@sanity/sanity-id/components/input"

// Props
type InputProps = ComponentProps<"input"> & {
  id: string  // Required for accessibility
  error?: ReactNode
  hint?: ReactNode
  label?: ReactNode
}

// Examples
<Input
  id="email"
  type="email"
  label="Email Address"
  placeholder="you@example.com"
  hint="We'll never share your email"
/>

<Input
  id="password"
  type="password"
  label="Password"
  required
  error="Password is required"
/>
```

## Textarea

Multi-line text input.

```tsx
import { Textarea } from "@sanity/sanity-id/components/textarea"

// Props
type TextareaProps = ComponentProps<"textarea"> & {
	id: string
	error?: ReactNode
	hint?: ReactNode
	label?: ReactNode
}

// Examples
;<Textarea
	id="message"
	label="Message"
	rows={5}
	hint="Maximum 500 characters"
/>
```

## Select

Dropdown selection input.

```tsx
import { Select } from "@sanity/sanity-id/components/select"

// Props
type SelectProps = ComponentProps<"select"> & {
	id: string
	error?: ReactNode
	hint?: ReactNode
	label?: ReactNode
}

// Examples
;<Select id="country" label="Country">
	<option value="">Select a country</option>
	<option value="us">United States</option>
	<option value="uk">United Kingdom</option>
</Select>
```

## Checkbox

Checkbox input with label.

```tsx
import { Checkbox } from "@sanity/sanity-id/components/checkbox"

// Props
type CheckboxProps = ComponentProps<"input"> & {
  id: string
  label: ReactNode
  hint?: ReactNode
}

// Examples
<Checkbox
  id="terms"
  label="I agree to the terms and conditions"
/>

<Checkbox
  id="newsletter"
  label="Subscribe to newsletter"
  hint="We send updates weekly"
  defaultChecked
/>
```

## Radio

Radio button input.

```tsx
import { Radio } from "@sanity/sanity-id/components/radio"

// Props
type RadioProps = ComponentProps<"input"> & {
  id: string
  label: ReactNode
  hint?: ReactNode
}

// Examples
<Radio
  id="option1"
  name="options"
  label="Option 1"
  value="1"
/>
<Radio
  id="option2"
  name="options"
  label="Option 2"
  value="2"
/>
```

## Switch

Toggle switch control.

```tsx
import { Switch } from "@sanity/sanity-id/components/switch"

// Props
type SwitchProps = ComponentProps<"input"> & {
  id: string
  label?: ReactNode
  hint?: ReactNode
}

// Examples
<Switch
  id="notifications"
  label="Enable notifications"
/>

<Switch
  id="darkMode"
  label="Dark mode"
  hint="Automatically switch based on system preference"
  defaultChecked
/>
```

## RadioSwitch

Toggle between multiple options.

```tsx
import { RadioSwitch } from "@sanity/sanity-id/components/radio-switch"

// Props
type RadioSwitchProps = {
	name: string
	options: Array<{
		label: ReactNode
		value: string
	}>
	defaultValue?: string
}

// Examples
;<RadioSwitch
	name="view"
	options={[
		{ label: "Grid", value: "grid" },
		{ label: "List", value: "list" },
	]}
	defaultValue="grid"
/>
```

## Breadcrumbs

Navigation breadcrumb trail.

```tsx
import { Breadcrumbs } from "@sanity/sanity-id/components/breadcrumbs"

// Props
type BreadcrumbsProps<E extends ElementType> = {
	as?: E
	items: Array<{
		href?: string
		label: ReactNode
	}>
}

// Examples
;<Breadcrumbs
	items={[
		{ href: "/", label: "Home" },
		{ href: "/docs", label: "Documentation" },
		{ label: "Getting Started" },
	]}
/>
```

## Eyebrow

Small heading above main titles.

```tsx
import { Eyebrow } from "@sanity/sanity-id/components/eyebrow"

// Props
type EyebrowProps = {
  children: ReactNode
  className?: string
}

// Examples
<Eyebrow>New Feature</Eyebrow>
<h1>Introducing Sanity Studio</h1>
```

## Code

Inline code formatting.

```tsx
import { Code } from "@sanity/sanity-id/components/code"

// Props
type CodeProps = {
	children: ReactNode
	className?: string
}

// Examples
;<p>
	Use <Code>npm install</Code> to install dependencies.
</p>
```

## CodeBlock

Syntax-highlighted code blocks.

```tsx
import { CodeBlock } from "@sanity/sanity-id/components/code-block"

// Props
type CodeBlockProps = {
	code: string
	language?: string
	filename?: string
	className?: string
}

// Examples
;<CodeBlock
	language="tsx"
	filename="Button.tsx"
	code={`
import { Button } from "@sanity/sanity-id/components/button"

export function MyButton() {
  return <Button>Click me</Button>
}
  `}
/>
```

## Table

Data table component.

```tsx
import { Table } from "@sanity/sanity-id/components/table"

// Props
type TableProps = {
	children: ReactNode
	className?: string
}

// Examples
;<Table>
	<thead>
		<tr>
			<th>Name</th>
			<th>Email</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>John Doe</td>
			<td>john@example.com</td>
		</tr>
	</tbody>
</Table>
```

## Person

User avatar with information.

```tsx
import { Person } from "@sanity/sanity-id/components/person"

// Props
type PersonProps = {
	name: string
	title?: string
	image?: string
	size?: "sm" | "md" | "lg"
}

// Examples
;<Person
	name="Jane Smith"
	title="Product Designer"
	image="/avatars/jane.jpg"
	size="md"
/>
```

## AvatarStack

Stack of overlapping user avatars.

```tsx
import { AvatarStack } from "@sanity/sanity-id/components/avatar-stack"

// Props
type AvatarStackProps = {
	avatars: Array<{
		name: string
		image?: string
	}>
	max?: number
	size?: "sm" | "md" | "lg"
}

// Examples
;<AvatarStack
	avatars={[
		{ name: "Alice", image: "/alice.jpg" },
		{ name: "Bob", image: "/bob.jpg" },
		{ name: "Charlie", image: "/charlie.jpg" },
	]}
	max={3}
	size="sm"
/>
```

## Chip

Compact information display.

```tsx
import { Chip } from "@sanity/sanity-id/components/chip"

// Props
type ChipProps = {
  children: ReactNode
  onDismiss?: () => void
  size?: "sm" | "md"
}

// Examples
<Chip>Filter: Active</Chip>
<Chip onDismiss={() => console.log('Remove')}>
  Tag: React
</Chip>
```

## LinkCTA

Call-to-action link with arrow.

```tsx
import { LinkCTA } from "@sanity/sanity-id/components/link-cta"

// Props
type LinkCTAProps<E extends ElementType> = {
  as?: E
  children: ReactNode
  className?: string
}

// Examples
<LinkCTA href="/learn-more">
  Learn more about Sanity
</LinkCTA>

<LinkCTA as={Link} href="/docs">
  Read the documentation
</LinkCTA>
```

## Testimonial

Quote/testimonial display.

```tsx
import { Testimonial } from "@sanity/sanity-id/components/testimonial"

// Props
type TestimonialProps = {
	quote: string
	author: string
	title?: string
	company?: string
	image?: string
}

// Examples
;<Testimonial
	quote="Sanity has transformed how we manage content."
	author="Sarah Johnson"
	title="CTO"
	company="TechCorp"
	image="/sarah.jpg"
/>
```

## TextCard

Text content card with title and description.

```tsx
import { TextCard } from "@sanity/sanity-id/components/text-card"

// Props
type TextCardProps = {
	title: ReactNode
	description: ReactNode
	icon?: IconSymbol
	className?: string
}

// Examples
;<TextCard
	title="Real-time Collaboration"
	description="Work together with your team in real-time."
	icon="users"
/>
```

## SanityIcon

Icon component wrapper for Sanity Icons.

```tsx
import { SanityIcon } from "@sanity/sanity-id/components/sanity-icon"

// Props
type SanityIconProps = {
  icon: IconSymbol
  className?: string
  size?: number
}

// Examples
<SanityIcon icon="document" />
<SanityIcon icon="edit" size={24} />
<SanityIcon icon="trash" className="text-red-500" />
```

## Common Patterns

### Form Example

```tsx
<form className="space-y-4">
	<Input id="name" label="Full Name" required />
	<Input id="email" type="email" label="Email" required />
	<Select id="role" label="Role">
		<option value="developer">Developer</option>
		<option value="designer">Designer</option>
	</Select>
	<Checkbox id="terms" label="I agree to the terms" />
	<Button type="submit" mode="primary">
		Submit
	</Button>
</form>
```

### Card Grid

```tsx
<div className="grid grid-cols-3 gap-4">
	<Card>
		<Eyebrow>Feature</Eyebrow>
		<h3 className="text-card-heading">Title 1</h3>
		<p className="text-body">Description</p>
	</Card>
	<Card>
		<Eyebrow>Update</Eyebrow>
		<h3 className="text-card-heading">Title 2</h3>
		<p className="text-body">Description</p>
	</Card>
	<Card>
		<Eyebrow>New</Eyebrow>
		<h3 className="text-card-heading">Title 3</h3>
		<p className="text-body">Description</p>
	</Card>
</div>
```

