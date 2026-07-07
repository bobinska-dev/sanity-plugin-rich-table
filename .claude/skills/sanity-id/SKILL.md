---
name: sanity-id
description: >
  Use the Sanity ID design system to build UI with Sanity's brand components, colors, and typography. Includes 23 React components, TailwindCSS v4 integration, design tokens, and theming support. Use when building interfaces that need Sanity brand consistency, creating marketing pages, or implementing component-based UIs with TypeScript and React. 
---

# Sanity ID Design System

Sanity ID is the official component library, token library, and TailwindCSS v4
config for Sanity's brand design system. This skill helps you build consistent,
accessible, and beautiful interfaces using Sanity's design language.

## Quick Start

### Installation

```bash
pnpm add @sanity/sanity-id
```

### Basic Setup

```css
/* In your global CSS */
@import "@sanity/sanity-id/tailwind.css";
@import "@sanity/sanity-id/components.css";
```

### Component Import Pattern

```tsx
// Components are imported individually, not from a barrel
import { Button } from "@sanity/sanity-id/components/button"
import { Card } from "@sanity/sanity-id/components/card"
```

## Core Concepts

### 1. Framework Agnostic Components

All components accept an `as` prop for polymorphic rendering:

```tsx
import { Button } from "@sanity/sanity-id/components/button"
import Link from "next/link"

// Render as Next.js Link
;<Button as={Link} href="/about">
	Learn More
</Button>
```

### 2. Theming System

- Uses `data-theme` attribute for dark/light modes
- Supports nested theme contexts
- Uses `light-dark()` CSS function for colors

```html
<html data-theme="dark">
	<section data-theme="light">
		<!-- This section uses light theme -->
	</section>
</html>
```

### 3. Typography Classes

Typography uses TailwindCSS utility classes:

```html
<h1 class="text-page-heading-xl">Main Heading</h1>
<p class="text-body-lg">Body text content</p>
```

## Available Components (23)

1. **AvatarStack** - Stack of user avatars
2. **Badge** - Status indicators with optional icons
3. **Breadcrumbs** - Navigation breadcrumbs
4. **Button** - Primary interactive element
5. **Card** - Content container
6. **Checkbox** - Form checkbox input
7. **Chip** - Compact info display
8. **Code** - Inline code formatting
9. **CodeBlock** - Syntax-highlighted code blocks
10. **Eyebrow** - Small heading above titles
11. **IconButton** - Icon-only button variant
12. **Input** - Text input field
13. **LinkCTA** - Call-to-action link
14. **Person** - User avatar with info
15. **Radio** - Radio button input
16. **RadioSwitch** - Toggle between options
17. **SanityIcon** - Icon component wrapper
18. **Select** - Dropdown selection
19. **Switch** - Toggle switch
20. **Table** - Data table
21. **Testimonial** - Quote/testimonial display
22. **Textarea** - Multi-line text input
23. **TextCard** - Text content card

## Design Tokens

### Color System

- **Primitive colors**: black, white, brand, gray (100-900), blue, green,
  magenta, yellow
- **Semantic colors**: fg-base, bg-base, border-base, accent colors
- All colors support light/dark themes automatically

### Using Colors

```tsx
// In TypeScript
import { primitiveColors, semanticColors } from "@sanity/sanity-id/colors"

// In CSS
.my-element {
  color: var(--color-fg-base);
  background: var(--color-bg-dim);
}

// In Tailwind
<div className="text-fg-base bg-bg-dim">
```

## Font Setup

Sanity ID uses:

- **Sans-serif**: Waldenburg
- **Monospace**: IBM Plex Mono

Define CSS custom properties:

```css
:root {
	--font-sans: "Waldenburg", ui-sans-serif, system-ui, sans-serif;
	--font-mono: "IBM Plex Mono", ui-monospace, monospace;
}
```

## Detailed References

For comprehensive documentation on specific topics:

- **All Components**: See `references/components.md` for complete props and
  examples
- **Design Tokens**: See `references/design-tokens.md` for color values and
  usage
- **Typography**: See `references/typography.md` for all text styles
- **Theming**: See `references/theming.md` for dark/light mode setup

## Code Templates

Ready-to-use patterns available in `references/`:

- `references/component-usage.tsx` - Common component patterns
- `references/setup-nextjs.md` - Next.js integration guide

## Best Practices

1. **Always use semantic colors** for automatic theme support
2. **Import components individually** for better tree-shaking
3. **Use the `as` prop** for framework integration
4. **Apply typography classes** for consistent text styling
5. **Set `data-theme`** at the root for theme control

## Common Patterns

### Form with Inputs

```tsx
import { Input } from "@sanity/sanity-id/components/input"
import { Button } from "@sanity/sanity-id/components/button"
import { Checkbox } from "@sanity/sanity-id/components/checkbox"

function ContactForm() {
	return (
		<form className="space-y-4">
			<Input label="Email" type="email" placeholder="you@example.com" />
			<Checkbox label="Subscribe to newsletter" />
			<Button type="submit" mode="primary">
				Submit
			</Button>
		</form>
	)
}
```

### Card Layout

```tsx
import { Card } from "@sanity/sanity-id/components/card"
import { Badge } from "@sanity/sanity-id/components/badge"
import { Eyebrow } from "@sanity/sanity-id/components/eyebrow"

function FeatureCard() {
	return (
		<Card>
			<Eyebrow>New Feature</Eyebrow>
			<h3 className="text-card-heading">Title</h3>
			<p className="text-body">Description</p>
			<Badge mode="accent-blue">Beta</Badge>
		</Card>
	)
}
```

## Requirements

- TailwindCSS v4 is required
- React 19+ for components
- TypeScript recommended for best DX
- Peer dependencies: @sanity/icons, classnames, shiki


