# Sanity ID Typography

Complete typography system with TailwindCSS utility classes.

## Typography Scale

Sanity ID uses TailwindCSS utility classes for typography. All classes are
responsive and theme-aware.

### Page Headings

Large, prominent headings for page titles and hero sections.

| Class                  | Size | Line Height | Usage                      |
| ---------------------- | ---- | ----------- | -------------------------- |
| `text-page-heading-xl` | 72px | 1.1         | Hero titles, landing pages |
| `text-page-heading`    | 48px | 1.2         | Main page titles           |
| `text-page-heading-sm` | 36px | 1.25        | Section headers            |

```html
<h1 class="text-page-heading-xl">The Content Operating System</h1>
<h2 class="text-page-heading">Welcome to Sanity</h2>
<h3 class="text-page-heading-sm">Getting Started</h3>
```

### Section Headings

Medium-sized headings for sections and subsections.

| Class                     | Size | Line Height | Usage          |
| ------------------------- | ---- | ----------- | -------------- |
| `text-section-heading`    | 28px | 1.3         | Major sections |
| `text-section-heading-sm` | 24px | 1.35        | Subsections    |

```html
<h2 class="text-section-heading">Features</h2>
<h3 class="text-section-heading-sm">Real-time Collaboration</h3>
```

### Card Headings

Headings specifically sized for card components.

| Class                  | Size | Line Height | Usage             |
| ---------------------- | ---- | ----------- | ----------------- |
| `text-card-heading`    | 20px | 1.4         | Card titles       |
| `text-card-heading-sm` | 18px | 1.4         | Small card titles |

```html
<div class="card">
	<h3 class="text-card-heading">Feature Card</h3>
	<p class="text-body">Card description text</p>
</div>
```

### Body Text

Standard paragraph and content text.

| Class          | Size | Line Height | Usage                     |
| -------------- | ---- | ----------- | ------------------------- |
| `text-body-lg` | 18px | 1.6         | Lead paragraphs, emphasis |
| `text-body`    | 16px | 1.6         | Default body text         |
| `text-body-sm` | 14px | 1.6         | Small print, captions     |
| `text-body-xs` | 12px | 1.5         | Labels, metadata          |

```html
<p class="text-body-lg">
	This is a lead paragraph with larger text for emphasis.
</p>
<p class="text-body">Standard body text for most content areas.</p>
<p class="text-body-sm">Smaller text for secondary information.</p>
<span class="text-body-xs">Last updated: Jan 2024</span>
```

### Monospace Text

For code, technical content, and data.

| Class          | Size | Line Height | Usage               |
| -------------- | ---- | ----------- | ------------------- |
| `text-mono-lg` | 16px | 1.5         | Code blocks         |
| `text-mono`    | 14px | 1.5         | Inline code         |
| `text-mono-sm` | 12px | 1.5         | Small code snippets |

```html
<code class="text-mono">const client = createClient()</code>
<pre class="text-mono-lg">
  // Larger code block
  function example() {
    return "Hello"
  }
</pre>
```

## Font Families

### Setting Up Fonts

```css
:root {
	--font-sans: "Waldenburg", ui-sans-serif, system-ui, sans-serif;
	--font-mono: "IBM Plex Mono", ui-monospace, monospace;
}
```

### Using Font Classes

```html
<!-- Sans-serif (default) -->
<p class="font-sans">Default sans-serif text</p>

<!-- Monospace -->
<code class="font-mono">Monospace code</code>
```

## Font Weights

| Class           | Weight | Usage              |
| --------------- | ------ | ------------------ |
| `font-normal`   | 400    | Body text, default |
| `font-semibold` | 600    | Headings, emphasis |
| `font-bold`     | 700    | Strong emphasis    |

```html
<p class="font-normal">Regular text</p>
<p class="font-semibold">Semi-bold emphasis</p>
<strong class="font-bold">Bold text</strong>
```

## Font Styles

| Class        | Style  | Usage            |
| ------------ | ------ | ---------------- |
| `italic`     | italic | Emphasis, quotes |
| `not-italic` | normal | Reset italic     |

```html
<em class="italic">Emphasized text</em>
<blockquote class="italic text-body-lg">"A thoughtful quote"</blockquote>
```

## Text Colors

Use semantic color tokens for automatic theme support:

```html
<!-- Primary text colors -->
<p class="text-fg-base">Primary text (black/white)</p>
<p class="text-fg-dim">Secondary text (gray-700/gray-300)</p>
<p class="text-fg-faint">Tertiary text (gray-500)</p>

<!-- Accent colors -->
<p class="text-fg-accent-blue">Blue accent text</p>
<p class="text-fg-accent-green">Green accent text</p>
<p class="text-fg-accent-magenta">Magenta accent text</p>
<p class="text-fg-accent-yellow">Yellow accent text</p>

<!-- Error state -->
<p class="text-fg-error">Error message text</p>
```

## Text Alignment

| Class          | Alignment      |
| -------------- | -------------- |
| `text-left`    | Left aligned   |
| `text-center`  | Center aligned |
| `text-right`   | Right aligned  |
| `text-justify` | Justified      |

```html
<p class="text-center text-page-heading">Centered Heading</p>
<p class="text-right text-body-sm">Right-aligned caption</p>
```

## Line Height

Custom line heights for specific needs:

| Class             | Line Height |
| ----------------- | ----------- |
| `leading-none`    | 1           |
| `leading-tight`   | 1.25        |
| `leading-snug`    | 1.375       |
| `leading-normal`  | 1.5         |
| `leading-relaxed` | 1.625       |
| `leading-loose`   | 2           |

## Letter Spacing

| Class              | Letter Spacing |
| ------------------ | -------------- |
| `tracking-tighter` | -0.05em        |
| `tracking-tight`   | -0.025em       |
| `tracking-normal`  | 0              |
| `tracking-wide`    | 0.025em        |
| `tracking-wider`   | 0.05em         |
| `tracking-widest`  | 0.1em          |

## Text Decoration

| Class          | Effect           |
| -------------- | ---------------- |
| `underline`    | Underlined text  |
| `line-through` | Strikethrough    |
| `no-underline` | Remove underline |

```html
<a class="underline text-fg-accent-blue">Underlined link</a>
<del class="line-through">Deleted text</del>
```

## Responsive Typography

All typography classes support responsive modifiers:

```html
<!-- Different sizes at different breakpoints -->
<h1 class="text-section-heading md:text-page-heading lg:text-page-heading-xl">
	Responsive Heading
</h1>

<!-- Mobile-first approach -->
<p class="text-body-sm sm:text-body md:text-body-lg">
	Responsive paragraph text
</p>
```

## Typography Patterns

### Hero Section

```html
<section class="text-center py-24">
	<p class="text-body-sm text-fg-dim uppercase tracking-wider">Introducing</p>
	<h1 class="text-page-heading-xl mt-2">Sanity Studio</h1>
	<p class="text-body-lg text-fg-dim mt-6 max-w-2xl mx-auto">
		The most flexible content platform
	</p>
</section>
```

### Article Layout

```html
<article class="prose max-w-3xl">
	<h1 class="text-page-heading">Article Title</h1>
	<p class="text-body-lg text-fg-dim">
		Article introduction or summary text that provides context.
	</p>
	<h2 class="text-section-heading mt-8">First Section</h2>
	<p class="text-body">
		Regular body text for the main content of your article.
	</p>
	<h3 class="text-section-heading-sm mt-6">Subsection</h3>
	<p class="text-body">More detailed information in subsections.</p>
</article>
```

### Data Display

```html
<div class="space-y-2">
	<p class="text-body-xs text-fg-faint uppercase tracking-wider">
		Total Revenue
	</p>
	<p class="text-page-heading">$1,234,567</p>
	<p class="text-body-sm text-fg-accent-green">+12% from last month</p>
</div>
```

### Form Labels

```html
<label class="block">
	<span class="text-body font-semibold"> Email Address </span>
	<span class="text-body-sm text-fg-dim ml-1"> (Required) </span>
	<input type="email" class="mt-1" />
	<p class="text-body-xs text-fg-faint mt-1">We'll never share your email</p>
</label>
```

## Best Practices

1. **Use semantic HTML elements** - `h1`-`h6` for headings, `p` for paragraphs
2. **Apply typography classes consistently** - Use the same class for similar
   content
3. **Maintain hierarchy** - Larger text for more important content
4. **Consider line length** - Use `max-w-prose` or similar for readability
5. **Test responsive behavior** - Ensure text scales appropriately
6. **Use semantic colors** - They adapt automatically to theme changes
7. **Avoid mixing type scales** - Stick to the defined scale for consistency

