# Sanity ID Theming Guide

Complete guide to implementing dark and light themes with Sanity ID.

## Theme System Overview

Sanity ID uses a `data-theme` attribute system that supports:

- Light and dark modes
- Nested theme contexts
- Automatic color adaptation
- System preference detection

## Basic Theme Setup

### 1. Setting the Theme

Apply the `data-theme` attribute to any element to control its theme:

```html
<!-- Set entire page to dark mode -->
<html data-theme="dark">
	<body>
		<!-- All content uses dark theme -->
	</body>
</html>

<!-- Set entire page to light mode -->
<html data-theme="light">
	<body>
		<!-- All content uses light theme -->
	</body>
</html>
```

### 2. Nested Theme Contexts

You can override themes for specific sections:

```html
<html data-theme="dark">
	<body>
		<!-- Page uses dark theme -->
		<section data-theme="light">
			<!-- This section uses light theme -->
			<h2>Light section on dark page</h2>

			<div data-theme="dark">
				<!-- Nested dark theme within light section -->
			</div>
		</section>
	</body>
</html>
```

## How Colors Adapt

All semantic colors automatically adapt based on the active theme:

| Color Token       | Light Theme        | Dark Theme         |
| ----------------- | ------------------ | ------------------ |
| `--color-fg-base` | black (#0b0b0b)    | white (#ffffff)    |
| `--color-bg-base` | white (#ffffff)    | black (#0b0b0b)    |
| `--color-fg-dim`  | gray-700 (#4a4a4a) | gray-300 (#b9b9b9) |
| `--color-bg-dim`  | gray-100 (#ededed) | gray-900 (#212121) |

## Using light-dark() Function

The `light-dark()` CSS function provides theme-aware values:

```css
.my-component {
	/* Automatically switches between light and dark values */
	color: light-dark(#000000, #ffffff);
	background: light-dark(#ffffff, #000000);
	border-color: light-dark(#cccccc, #333333);
}

/* Using with CSS variables */
.card {
	background: light-dark(var(--color-white), var(--color-gray-900));
}
```

## Tailwind Theme Variants

Sanity ID extends Tailwind with `light:` and `dark:` variants:

```html
<!-- Different styles for each theme -->
<div class="light:bg-white dark:bg-black">
	<h1 class="light:text-black dark:text-white">Adaptive heading</h1>
	<p class="light:text-gray-700 dark:text-gray-300">Secondary text</p>
</div>

<!-- Border colors -->
<div class="border light:border-gray-200 dark:border-gray-800">
	Adaptive border
</div>

<!-- Shadows -->
<div class="light:shadow-lg dark:shadow-none">Shadow in light mode only</div>
```

## CSS Theme Styling

### Using @variant

For non-color CSS properties, use the `@variant` directive:

```css
.hero-pattern {
	/* Different background images per theme */
	@variant light {
		background-image: url("/patterns/light-hero.svg");
	}

	@variant dark {
		background-image: url("/patterns/dark-hero.svg");
	}
}

.icon {
	/* Different filters per theme */
	@variant light {
		filter: brightness(0.9);
	}

	@variant dark {
		filter: brightness(1.1);
	}
}
```

### Using [data-theme] Selectors

For broader browser compatibility:

```css
/* Light theme styles */
[data-theme="light"] .my-component {
	background-image: url("/light-bg.png");
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Dark theme styles */
[data-theme="dark"] .my-component {
	background-image: url("/dark-bg.png");
	box-shadow: 0 2px 4px rgba(255, 255, 255, 0.1);
}
```

## Implementing Theme Switching

### Basic HTML/JavaScript

```html
<button id="theme-toggle">Toggle Theme</button>

<script>
	const toggle = document.getElementById("theme-toggle")
	const html = document.documentElement

	toggle.addEventListener("click", () => {
		const current = html.getAttribute("data-theme")
		const next = current === "light" ? "dark" : "light"
		html.setAttribute("data-theme", next)

		// Persist preference
		localStorage.setItem("theme", next)
	})

	// Load saved preference
	const saved = localStorage.getItem("theme")
	if (saved) {
		html.setAttribute("data-theme", saved)
	}
</script>
```

### React Implementation

```tsx
import { useState, useEffect } from "react"
import { RadioSwitch } from "@sanity/sanity-id/components/radio-switch"

function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setTheme] = useState<"light" | "dark" | "system">("system")

	useEffect(() => {
		// Load saved preference
		const saved = localStorage.getItem("theme") as typeof theme
		if (saved) setTheme(saved)
	}, [])

	useEffect(() => {
		let activeTheme = theme

		if (theme === "system") {
			const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
			activeTheme = isDark ? "dark" : "light"
		}

		document.documentElement.setAttribute("data-theme", activeTheme)
		localStorage.setItem("theme", theme)
	}, [theme])

	return (
		<>
			<RadioSwitch
				name="theme"
				options={[
					{ label: "Light", value: "light" },
					{ label: "Dark", value: "dark" },
					{ label: "System", value: "system" },
				]}
				defaultValue={theme}
				onChange={(e) => setTheme(e.target.value as typeof theme)}
			/>
			{children}
		</>
	)
}
```

### Next.js with next-themes

```tsx
// app/providers.tsx
"use client"

import { ThemeProvider } from "next-themes"

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="data-theme"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
			values={{
				light: "light",
				dark: "dark",
			}}
		>
			{children}
		</ThemeProvider>
	)
}

// components/theme-switcher.tsx
;("use client")

import { useTheme } from "next-themes"
import { RadioSwitch } from "@sanity/sanity-id/components/radio-switch"

export function ThemeSwitcher() {
	const { theme, setTheme } = useTheme()

	return (
		<RadioSwitch
			name="theme"
			options={[
				{ label: "Light", value: "light" },
				{ label: "Dark", value: "dark" },
				{ label: "System", value: "system" },
			]}
			defaultValue={theme}
			onChange={(e) => setTheme(e.target.value)}
		/>
	)
}
```

## System Preference Detection

Detect and respond to system theme preferences:

```javascript
// Check current system preference
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

// Listen for changes
window
	.matchMedia("(prefers-color-scheme: dark)")
	.addEventListener("change", (e) => {
		if (theme === "system") {
			const newTheme = e.matches ? "dark" : "light"
			document.documentElement.setAttribute("data-theme", newTheme)
		}
	})
```

## Theme-Aware Components

### Example: Adaptive Card

```tsx
function AdaptiveCard({ children }: { children: React.ReactNode }) {
	return (
		<div
			className="
      bg-bg-base
      border border-border-dim
      light:shadow-lg dark:shadow-none
      rounded-lg p-6
    "
		>
			{children}
		</div>
	)
}
```

### Example: Status Indicator

```tsx
function StatusIndicator({
	status,
}: {
	status: "success" | "error" | "warning"
}) {
	const colors = {
		success: "text-fg-accent-green bg-bg-accent-green-dim",
		error: "text-fg-error light:bg-red-100 dark:bg-red-900",
		warning: "text-fg-accent-yellow bg-bg-accent-yellow-dim",
	}

	return <span className={`px-2 py-1 rounded ${colors[status]}`}>{status}</span>
}
```

## Theme Testing

### Visual Testing Checklist

- [ ] Text remains readable in both themes
- [ ] Sufficient contrast ratios maintained
- [ ] Interactive elements clearly visible
- [ ] Focus states apparent in both themes
- [ ] Images/icons visible in both themes
- [ ] No color conflicts or invisible elements

### Accessibility Considerations

1. **Contrast Ratios**: All semantic color combinations meet WCAG AA standards
2. **Focus Indicators**: Ensure focus states are visible in both themes
3. **Color Independence**: Don't rely solely on color to convey information
4. **User Control**: Always provide theme switching options

## Common Patterns

### Split Theme Layout

```html
<div class="grid grid-cols-2 h-screen">
	<div data-theme="light" class="bg-bg-base p-8">
		<h2 class="text-fg-base">Light Side</h2>
	</div>
	<div data-theme="dark" class="bg-bg-base p-8">
		<h2 class="text-fg-base">Dark Side</h2>
	</div>
</div>
```

### Theme Preview Cards

```tsx
function ThemePreview() {
	return (
		<div class="grid grid-cols-2 gap-4">
			<div
				data-theme="light"
				class="p-4 bg-bg-base border border-border-base rounded"
			>
				<h3 class="text-fg-base">Light Theme</h3>
				<p class="text-fg-dim">Preview of light colors</p>
				<Button mode="primary">Button</Button>
			</div>
			<div
				data-theme="dark"
				class="p-4 bg-bg-base border border-border-base rounded"
			>
				<h3 class="text-fg-base">Dark Theme</h3>
				<p class="text-fg-dim">Preview of dark colors</p>
				<Button mode="primary">Button</Button>
			</div>
		</div>
	)
}
```

### Inverted Sections

```html
<!-- Main page in light mode -->
<html data-theme="light">
	<body>
		<!-- Hero section with inverted theme -->
		<section data-theme="dark" class="bg-bg-base py-24">
			<h1 class="text-fg-base text-page-heading-xl">
				Stand out with inverted sections
			</h1>
		</section>

		<!-- Rest of page continues in light mode -->
		<section class="bg-bg-base">
			<!-- Light theme content -->
		</section>
	</body>
</html>
```

## Troubleshooting

### Theme Not Applying

- Check `data-theme` attribute is set correctly
- Verify CSS files are loaded (`@sanity/sanity-id/tailwind.css`)
- Ensure no conflicting theme libraries

### Colors Not Changing

- Use semantic color tokens, not primitive colors
- Check for hard-coded color values
- Verify `light-dark()` function support

### Flash of Wrong Theme

- Set theme before first paint
- Use `suppressHydrationWarning` in Next.js
- Load theme preference synchronously

### Nested Themes Not Working

- Check browser support for style queries
- Fallback may not support complex nesting
- Test in modern browsers first

