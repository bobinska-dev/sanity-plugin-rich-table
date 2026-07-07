# Sanity ID Design Tokens

Complete reference for colors, spacing, and design tokens in the Sanity ID
design system.

## Color System

Sanity ID uses a two-tier color system: primitive colors (raw values) and
semantic colors (contextual usage).

### Primitive Colors

Raw color values available in the system:

```typescript
import { primitiveColors } from "@sanity/sanity-id/colors"
```

| Color           | Variable              | Hex     | P3           |
| --------------- | --------------------- | ------- | ------------ |
| **black**       | `--color-black`       | #0b0b0b | -            |
| **white**       | `--color-white`       | #ffffff | -            |
| **brand**       | `--color-brand`       | #ff5500 | -            |
| **gray-100**    | `--color-gray-100`    | #ededed | -            |
| **gray-200**    | `--color-gray-200`    | #d6d6d6 | -            |
| **gray-300**    | `--color-gray-300`    | #b9b9b9 | -            |
| **gray-500**    | `--color-gray-500`    | #797979 | -            |
| **gray-700**    | `--color-gray-700`    | #4a4a4a | -            |
| **gray-800**    | `--color-gray-800`    | #353535 | -            |
| **gray-900**    | `--color-gray-900`    | #212121 | -            |
| **blue-100**    | `--color-blue-100`    | #afe3ff | -            |
| **blue-300**    | `--color-blue-300`    | #55beff | -            |
| **blue-500**    | `--color-blue-500`    | #027fff | P3 available |
| **blue-700**    | `--color-blue-700`    | #0053ef | -            |
| **green-100**   | `--color-green-100`   | #96ff6f | -            |
| **green-300**   | `--color-green-300`   | #45ff00 | -            |
| **green-500**   | `--color-green-500`   | #3fea00 | P3 available |
| **green-700**   | `--color-green-700`   | #19d600 | -            |
| **magenta-100** | `--color-magenta-100` | #fcb9ff | -            |
| **magenta-300** | `--color-magenta-300` | #fa84ff | -            |
| **magenta-500** | `--color-magenta-500` | #f84eff | P3 available |
| **magenta-700** | `--color-magenta-700` | #f500ff | -            |
| **yellow-100**  | `--color-yellow-100`  | #fcffd6 | -            |
| **yellow-300**  | `--color-yellow-300`  | #ffff9f | -            |
| **yellow-500**  | `--color-yellow-500`  | #ffff00 | P3 available |
| **yellow-700**  | `--color-yellow-700`  | #fff500 | -            |

### Semantic Colors

Context-aware colors that automatically adapt to light/dark themes:

```typescript
import { semanticColors } from "@sanity/sanity-id/colors"
```

#### Foreground Colors

| Token                | Variable                   | Light Mode | Dark Mode | Usage              |
| -------------------- | -------------------------- | ---------- | --------- | ------------------ |
| **fg-base**          | `--color-fg-base`          | black      | white     | Primary text       |
| **fg-dim**           | `--color-fg-dim`           | gray-700   | gray-300  | Secondary text     |
| **fg-faint**         | `--color-fg-faint`         | gray-500   | gray-500  | Tertiary text      |
| **fg-inverse-base**  | `--color-fg-inverse-base`  | white      | black     | Inverted text      |
| **fg-inverse-dim**   | `--color-fg-inverse-dim`   | gray-300   | gray-700  | Inverted secondary |
| **fg-inverse-faint** | `--color-fg-inverse-faint` | gray-500   | gray-500  | Inverted tertiary  |
| **fg-error**         | `--color-fg-error`         | #dd0000    | #ff2222   | Error messages     |

#### Accent Foreground Colors

| Token                 | Variable                    | Light Mode  | Dark Mode   |
| --------------------- | --------------------------- | ----------- | ----------- |
| **fg-accent-blue**    | `--color-fg-accent-blue`    | blue-500    | blue-500    |
| **fg-accent-green**   | `--color-fg-accent-green`   | green-500   | green-500   |
| **fg-accent-magenta** | `--color-fg-accent-magenta` | magenta-500 | magenta-500 |
| **fg-accent-yellow**  | `--color-fg-accent-yellow`  | yellow-500  | yellow-500  |

#### Background Colors

| Token               | Variable                  | Light Mode | Dark Mode | Usage                |
| ------------------- | ------------------------- | ---------- | --------- | -------------------- |
| **bg-base**         | `--color-bg-base`         | white      | black     | Primary background   |
| **bg-dim**          | `--color-bg-dim`          | gray-100   | gray-900  | Secondary background |
| **bg-inverse-base** | `--color-bg-inverse-base` | black      | white     | Inverted background  |
| **bg-inverse-dim**  | `--color-bg-inverse-dim`  | gray-900   | gray-100  | Inverted secondary   |

#### Accent Background Colors

| Token                      | Variable                         | Light Mode  | Dark Mode   |
| -------------------------- | -------------------------------- | ----------- | ----------- |
| **bg-accent-blue-base**    | `--color-bg-accent-blue-base`    | blue-500    | blue-500    |
| **bg-accent-blue-dim**     | `--color-bg-accent-blue-dim`     | blue-100    | blue-700    |
| **bg-accent-green-base**   | `--color-bg-accent-green-base`   | green-500   | green-500   |
| **bg-accent-green-dim**    | `--color-bg-accent-green-dim`    | green-100   | green-700   |
| **bg-accent-magenta-base** | `--color-bg-accent-magenta-base` | magenta-500 | magenta-500 |
| **bg-accent-magenta-dim**  | `--color-bg-accent-magenta-dim`  | magenta-100 | magenta-700 |
| **bg-accent-yellow-base**  | `--color-bg-accent-yellow-base`  | yellow-500  | yellow-500  |
| **bg-accent-yellow-dim**   | `--color-bg-accent-yellow-dim`   | yellow-100  | yellow-700  |

#### Border Colors

| Token                   | Variable                      | Light Mode | Dark Mode | Usage             |
| ----------------------- | ----------------------------- | ---------- | --------- | ----------------- |
| **border-base**         | `--color-border-base`         | black      | white     | Primary borders   |
| **border-dim**          | `--color-border-dim`          | gray-200   | gray-800  | Secondary borders |
| **border-faint**        | `--color-border-faint`        | gray-100   | gray-900  | Subtle borders    |
| **border-inverse-base** | `--color-border-inverse-base` | white      | black     | Inverted borders  |

#### Accent Border Colors

| Token                     | Variable                        | Light Mode  | Dark Mode   |
| ------------------------- | ------------------------------- | ----------- | ----------- |
| **border-accent-blue**    | `--color-border-accent-blue`    | blue-700    | blue-500    |
| **border-accent-green**   | `--color-border-accent-green`   | green-700   | green-500   |
| **border-accent-magenta** | `--color-border-accent-magenta` | magenta-700 | magenta-500 |
| **border-accent-yellow**  | `--color-border-accent-yellow`  | yellow-700  | yellow-500  |

## Using Colors in Code

### In CSS

```css
/* Use semantic colors for automatic theme support */
.my-component {
	color: var(--color-fg-base);
	background-color: var(--color-bg-dim);
	border: 1px solid var(--color-border-dim);
}

/* Accent colors */
.highlight {
	color: var(--color-fg-accent-blue);
	background-color: var(--color-bg-accent-blue-dim);
}

/* Using light-dark() for custom values */
.custom {
	color: light-dark(var(--color-black), var(--color-white));
}
```

### In Tailwind Classes

```html
<!-- Text colors -->
<p class="text-fg-base">Primary text</p>
<p class="text-fg-dim">Secondary text</p>
<p class="text-fg-faint">Tertiary text</p>

<!-- Background colors -->
<div class="bg-bg-base">Default background</div>
<div class="bg-bg-dim">Dimmed background</div>

<!-- Border colors -->
<div class="border border-border-base">Strong border</div>
<div class="border border-border-dim">Regular border</div>
<div class="border border-border-faint">Subtle border</div>

<!-- Accent colors -->
<button class="text-fg-accent-blue bg-bg-accent-blue-dim">
	Blue accent button
</button>
```

### In TypeScript

```typescript
import { primitiveColors, semanticColors } from "@sanity/sanity-id/colors"

// Access primitive colors
console.log(primitiveColors.brand.hex) // "#ff5500"
console.log(primitiveColors.blue500.variable) // "--color-blue-500"

// Access semantic colors
console.log(semanticColors.fgBase.light.hex) // "#0b0b0b" (black)
console.log(semanticColors.fgBase.dark.hex) // "#ffffff" (white)

// Use in dynamic styles
const style = {
	backgroundColor: semanticColors.bgDim.light.hex,
	color: semanticColors.fgBase.light.hex,
}
```

## Theme-Specific Styles

### Using Tailwind Variants

```html
<!-- Different colors for light/dark -->
<div class="light:bg-white dark:bg-black">
	<p class="light:text-black dark:text-white">Adaptive text</p>
</div>
```

### Using CSS

```css
/* Light theme specific */
[data-theme="light"] .my-component {
	background-image: url("/light-pattern.svg");
}

/* Dark theme specific */
[data-theme="dark"] .my-component {
	background-image: url("/dark-pattern.svg");
}

/* Using @variant for non-color values */
.background-pattern {
	@variant light {
		background-image: url("/light-pattern.svg");
	}

	@variant dark {
		background-image: url("/dark-pattern.svg");
	}
}
```

## Best Practices

1. **Always use semantic colors** for UI elements - they automatically adapt to
   themes
2. **Reserve primitive colors** for brand elements that shouldn't change with
   theme
3. **Use `light-dark()`** in CSS for custom color values that need theme support
4. **Test in both themes** to ensure proper contrast and visibility
5. **Prefer CSS variables** over hard-coded hex values for maintainability

## Color Usage Guidelines

### Text Hierarchy

- **fg-base**: Headlines, body text, primary content
- **fg-dim**: Subtitles, secondary information, metadata
- **fg-faint**: Placeholders, hints, disabled states

### Backgrounds

- **bg-base**: Main content areas, cards on dim backgrounds
- **bg-dim**: Page backgrounds, sections, sidebars

### Borders

- **border-base**: Primary dividers, focused inputs
- **border-dim**: Default borders, cards, subtle divisions
- **border-faint**: Very subtle separators, grouping elements

### Accent Colors

- **Blue**: Links, informational elements, primary actions
- **Green**: Success states, confirmations, positive feedback
- **Yellow**: Warnings, important notices, highlights
- **Magenta**: Special features, premium content, creative elements

## Accessibility

All semantic color combinations meet WCAG AA contrast requirements:

- fg-base on bg-base: AAA compliant
- fg-dim on bg-base: AA compliant
- fg-accent-\* on bg-base: AA compliant
- Inverse combinations maintain same contrast ratios

