# Sanity ID + Next.js Setup Guide

Complete setup instructions for using Sanity ID with Next.js App Router.

## 1. Installation

```bash
pnpm add @sanity/sanity-id @sanity/icons classnames shiki @shikijs/langs
```

## 2. Font Configuration

Create a fonts configuration file:

```tsx
// app/fonts.ts
import localFont from "next/font/local"

const waldenburgNormal = localFont({
	src: [
		{
			path: "./fonts/Waldenburg-Book.woff2",
			weight: "400",
			style: "normal",
		},
		{
			path: "./fonts/Waldenburg-BookItalic.woff2",
			weight: "400",
			style: "italic",
		},
		{
			path: "./fonts/Waldenburg-Bold.woff2",
			weight: "600",
			style: "normal",
		},
	],
	display: "swap",
	variable: "--font-sans",
	fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
	preload: true,
})

const ibmPlexMono = localFont({
	src: [
		{
			path: "./fonts/IBMPlexMono-Regular.woff2",
			weight: "400",
			style: "normal",
		},
		{
			path: "./fonts/IBMPlexMono-Italic.woff2",
			weight: "400",
			style: "italic",
		},
	],
	display: "swap",
	variable: "--font-mono",
	fallback: ["ui-monospace", "monospace"],
	preload: true,
})

export const fonts = `${waldenburgNormal.variable} ${ibmPlexMono.variable}`
```

## 3. Root Layout Setup

Configure your root layout:

```tsx
// app/layout.tsx
import { fonts } from "./fonts"
import "./globals.css"

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en" className={fonts} data-theme="light">
			<body>{children}</body>
		</html>
	)
}
```

## 4. Global CSS

Add Sanity ID styles to your global CSS:

```css
/* app/globals.css */
@import "@sanity/sanity-id/tailwind.css";
@import "@sanity/sanity-id/components.css";

/* Additional global styles */
body {
	font-family: var(--font-sans);
}

code,
pre {
	font-family: var(--font-mono);
}
```

## 5. PostCSS Configuration

Create or update postcss.config.js:

```js
// postcss.config.js
module.exports = {
	plugins: {
		"@tailwindcss/postcss": {},
	},
}
```

## 6. Component Usage with Next.js Link

When using components with Next.js Link:

```tsx
import Link from "next/link"
import { Button } from "@sanity/sanity-id/components/button"
import { LinkCTA } from "@sanity/sanity-id/components/link-cta"
import { IconButton } from "@sanity/sanity-id/components/icon-button"

export function Navigation() {
	return (
		<nav className="flex gap-4">
			{/* Button as Next.js Link */}
			<Button as={Link} href="/about" mode="ghost">
				About
			</Button>

			{/* IconButton as Next.js Link */}
			<IconButton
				as={Link}
				href="/settings"
				icon="settings"
				aria-label="Settings"
			/>

			{/* LinkCTA as Next.js Link */}
			<LinkCTA as={Link} href="/docs">
				Documentation
			</LinkCTA>
		</nav>
	)
}
```

## 7. Theme Switching

Implement theme switching with next-themes:

```bash
pnpm add next-themes
```

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
		>
			{children}
		</ThemeProvider>
	)
}
```

Update layout:

```tsx
// app/layout.tsx
import { Providers } from "./providers"
import { fonts } from "./fonts"
import "./globals.css"

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en" className={fonts} suppressHydrationWarning>
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}
```

Theme switcher component:

```tsx
// components/theme-switcher.tsx
"use client"

import { useTheme } from "next-themes"
import { RadioSwitch } from "@sanity/sanity-id/components/radio-switch"
import { useEffect, useState } from "react"

export function ThemeSwitcher() {
	const { theme, setTheme } = useTheme()
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	if (!mounted) return null

	return (
		<RadioSwitch
			name="theme"
			options={[
				{ label: "Light", value: "light" },
				{ label: "Dark", value: "dark" },
				{ label: "System", value: "system" },
			]}
			defaultValue={theme || "system"}
			onChange={(e) => setTheme(e.target.value)}
		/>
	)
}
```

## 8. Icon Setup

For Sanity Icons to work properly, ensure your app has access to the Iconophor
endpoint:

### Option A: Use Sanity's endpoint (if on sanity.io domain)

Icons will automatically work if your app is deployed on a sanity.io subdomain.

### Option B: Set up a proxy/rewrite

Add to next.config.js:

```js
// next.config.js
module.exports = {
	async rewrites() {
		return [
			{
				source: "/iconophor/:path*",
				destination: "https://www.sanity.io/iconophor/:path*",
			},
		]
	},
}
```

### Option C: Set up your own Iconophor endpoint

See [Iconophor documentation](https://github.com/msfragala/iconophor) for setup
instructions.

## 9. Metadata Configuration

Set up metadata for your pages:

```tsx
// app/layout.tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
	title: "My App - Built with Sanity ID",
	description: "A beautiful app using Sanity's design system",
	openGraph: {
		title: "My App",
		description: "A beautiful app using Sanity's design system",
		type: "website",
	},
}
```

## 10. Example Page

Complete example page using Sanity ID:

```tsx
// app/page.tsx
import { Button } from "@sanity/sanity-id/components/button"
import { Card } from "@sanity/sanity-id/components/card"
import { Eyebrow } from "@sanity/sanity-id/components/eyebrow"
import { Badge } from "@sanity/sanity-id/components/badge"

export default function HomePage() {
	return (
		<main className="container mx-auto px-4 py-12">
			<section className="text-center mb-16">
				<Eyebrow>Welcome to</Eyebrow>
				<h1 className="text-page-heading-xl mt-4">My Sanity ID App</h1>
				<p className="text-body-lg mt-6 max-w-2xl mx-auto">
					Building beautiful interfaces with Sanity's design system
				</p>
				<div className="flex gap-4 justify-center mt-8">
					<Button mode="primary" size="lg">
						Get Started
					</Button>
					<Button mode="outline" size="lg">
						Learn More
					</Button>
				</div>
			</section>

			<section className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{[1, 2, 3].map((i) => (
					<Card key={i} mode="outline">
						<Badge icon="sparkles">Feature {i}</Badge>
						<h3 className="text-card-heading mt-4">Amazing Feature</h3>
						<p className="text-body mt-2">
							Description of this amazing feature that does incredible things.
						</p>
					</Card>
				))}
			</section>
		</main>
	)
}
```

## Common Issues & Solutions

### Fonts Not Loading

- Ensure font files are in the correct location
- Check that font variables are properly set in CSS
- Verify the fonts are being applied to the HTML element

### Theme Not Switching

- Make sure `suppressHydrationWarning` is on the HTML element
- Verify ThemeProvider is wrapping your app
- Check that `data-theme` attribute is being set

### Icons Not Displaying

- Verify Iconophor endpoint is accessible
- Check network tab for icon requests
- Ensure @sanity/icons is installed

### TypeScript Errors

- Make sure all peer dependencies are installed
- Update TypeScript to version 5.0 or higher
- Check that types are properly exported from Sanity ID

