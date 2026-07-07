---
name: sanity-brand-hero-screen
description: Build full-bleed Sanity-brand hero / placeholder screens (coming-soon, maintenance, splash, beta-gate, branded error pages) matching the Sanity marketing site aesthetic — black background with dot texture, large bold headline, pill outline buttons. Use when creating any full-bleed branded landing or placeholder UI in SDK apps (`sdk-apps/*`) or Sanity Studios (`studios/*`), or when the user mentions "coming soon", "splash page", "maintenance page", "marketing-style hero", or asks to make a screen feel like sanity.io.
---

# Sanity-brand hero screen

Reusable visual treatment for full-bleed placeholder / hero screens that match the Sanity marketing site aesthetic (e.g. the "Less talk, more code" / "Enterprise-grade everything" blocks on https://www.sanity.io). Use this for coming-soon pages, maintenance modes, splash screens, beta-access gates, and similar full-bleed branded UIs across SDK apps and Sanity Studios.

The contract is intentionally narrow — same look across both surfaces, inline styles only, no theme switching, no layout chrome.

## When to use

- Replacing a full app/Studio entry point with a temporary placeholder (coming-soon, maintenance, beta gate).
- Building branded error pages, 404s, or onboarding splash screens.
- Any screen that should feel like sanity.io marketing material rather than a Studio/dashboard tool.

## Visual contract

| Element    | Treatment                                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Background | Solid `#0B0B0B` (`BLACK` from `@os-apps/ui/utils/palette`). Always dark — do NOT switch on colour scheme.                                                           |
| Texture    | `TEXTURE_PATTERN_DARK` overlay at `opacity: 0.25`, `pointer-events: none`, absolutely positioned.                                                                   |
| Brand mark | `<SanityMark width={56} height={45} style={{ color: '#FFFFFF' }} />` from `@os-apps/ui/components/SanityMark`.                                                      |
| Eyebrow    | Mono font, uppercase, 12px, `letter-spacing: 0.2em`, colour `#B9B9B9` (gray-300). Optional but recommended — names the surface ("Coach", "Coach Studio").           |
| Headline   | Sans-serif, fluid `clamp(48px, 9vw, 96px)`, `font-weight: 500`, `line-height: 0.95`, `letter-spacing: -0.02em`. Short — 2–3 words ("Coming soon", "Be right back"). |
| Body       | 16–18px fluid, `line-height: 1.5`, `max-width: 540px`, colour `#B9B9B9`. One short paragraph.                                                                       |
| Buttons    | Pill outline (`border-radius: 999`), white border, uppercase 12px label with `letter-spacing: 0.1em`. Inverts to white-on-black on hover and focus.                 |
| Footer     | 14px `#797979` (gray-500) with white underlined links. Optional — used for contact / access lines.                                                                  |
| Layout     | Centered, `max-width: 720px`, padding `64px 32px`, `text-align: center`.                                                                                            |

## Quick start

Both SDK apps and Studios use **inline styles** so the placeholder is self-contained — no Tailwind, no CSS modules, no theme tokens beyond the texture pattern import. This keeps the production bundle tiny and avoids fighting with the host's stylesheet.

```tsx
import { useState, type CSSProperties, type ReactNode } from 'react'
import { SanityMark } from '@os-apps/ui/components/SanityMark'
import { TEXTURE_PATTERN_DARK } from '@os-apps/ui/utils/texture'

export function HeroScreen() {
  return (
    <main style={pageStyle}>
      <div aria-hidden="true" style={textureOverlayStyle} />
      <div style={contentStyle}>
        <SanityMark width={56} height={45} style={{ color: '#FFFFFF', marginBottom: 48 }} />
        <p style={eyebrowStyle}>Surface name</p>
        <h1 style={headingStyle}>Headline</h1>
        <p style={bodyStyle}>One short paragraph of context.</p>
        <div style={buttonRowStyle}>
          <PillButton href="https://...">Primary action</PillButton>
          <PillButton href="https://...">Secondary action</PillButton>
        </div>
        <p style={footerStyle}>
          Optional footer line with a{' '}
          <a href="https://..." target="_blank" rel="noopener noreferrer" style={footerLinkStyle}>
            contact link
          </a>
          .
        </p>
      </div>
    </main>
  )
}

function PillButton({ href, children }: { href: string; children: ReactNode }) {
  const [hover, setHover] = useState(false)
  return (
    <a
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{
        ...pillButtonStyle,
        background: hover ? '#FFFFFF' : 'transparent',
        color: hover ? '#0B0B0B' : '#FFFFFF',
      }}
    >
      {children}
    </a>
  )
}
```

## Style tokens — copy verbatim

These encode the brand contract. Don't tweak the spacing, font sizes, or colours unless explicitly asked.

```ts
const pageStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#0B0B0B',
  color: '#FFFFFF',
  fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
  overflow: 'auto',
}

const textureOverlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage: TEXTURE_PATTERN_DARK,
  backgroundRepeat: 'repeat',
  opacity: 0.25,
  pointerEvents: 'none',
}

const contentStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  width: '100%',
  maxWidth: 720,
  padding: '64px 32px',
  textAlign: 'center',
}

const eyebrowStyle: CSSProperties = {
  margin: 0,
  marginBottom: 24,
  color: '#B9B9B9',
  fontFamily: 'var(--font-mono, ui-monospace, monospace)',
  fontSize: 12,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
}

const headingStyle: CSSProperties = {
  margin: 0,
  marginBottom: 32,
  fontSize: 'clamp(48px, 9vw, 96px)',
  fontWeight: 500,
  lineHeight: 0.95,
  letterSpacing: '-0.02em',
}

const bodyStyle: CSSProperties = {
  margin: '0 auto 48px',
  maxWidth: 540,
  color: '#B9B9B9',
  fontSize: 'clamp(16px, 2vw, 18px)',
  lineHeight: 1.5,
}

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 16,
  justifyContent: 'center',
  marginBottom: 64,
}

const pillButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '14px 28px',
  borderRadius: 999,
  border: '1px solid #FFFFFF',
  textDecoration: 'none',
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  transition: 'background 150ms ease, color 150ms ease',
}

const footerStyle: CSSProperties = {
  margin: 0,
  color: '#797979',
  fontSize: 14,
  lineHeight: 1.5,
}

const footerLinkStyle: CSSProperties = {
  color: '#FFFFFF',
  fontWeight: 500,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
}
```

## SDK app surface (`sdk-apps/*`)

- Replace the `App.tsx` default export with the hero component to skip `SanityApp`, routing, and contexts. The full app config can stay on a different branch (e.g. `staging`) untouched.
- The Waldenburg + IBM Plex Mono fonts are already loaded by `App.css` and exposed as `--font-sans` / `--font-mono`. The style tokens above reference these CSS variables, so the right fonts render automatically.
- Don't pull in `@sanity/sdk-react`, `react-router`, or other heavy deps — the placeholder should be a single React component.

## Studio surface (`studios/*`)

- Mount via `studio.components.layout` to short-circuit the entire Studio chrome:
  ```ts
  studio: {
    components: {
      layout: HeroScreen
    }
  }
  ```
- Pair with `schema: { types: [] }` and **no plugins** when the goal is a tiny placeholder bundle that doesn't load schemas/structure resolvers.
- The component receives `LayoutProps` from `sanity` — you do NOT need to call `renderDefault`; intentionally skipping it replaces the Studio UI entirely.
- Studios don't ship Waldenburg / IBM Plex Mono. The system-ui + `ui-monospace` fallbacks in the style tokens render acceptably; don't reference CSS variables that aren't loaded.

## Hard-coded URLs vs env vars

When the placeholder needs to link at a _different_ environment than the one being built (e.g. a production placeholder linking to staging), **hard-code the deployment IDs** as constants in the file. Do NOT use the per-environment env vars (`SANITY_APP_*_DEPLOYMENT_ID`, `SANITY_STUDIO_*_APP_ID`) — they resolve to the _current_ environment's IDs at build time, which is the wrong direction.

Sanity Dashboard URL pattern:

```
https://www.sanity.io/@<orgId>/{studio|application}/<deploymentId>/
```

Example constants:

```ts
const SANITY_ORG_ID = 'oSyH1iET5'
const STAGING_STUDIO_DEPLOYMENT_ID = 'v1cc60qsi2bjtbpc9cckv0u5'
const STAGING_APP_DEPLOYMENT_ID = 'h19dqzdnvwpsgyrl1efhmdvu'

const STAGING_STUDIO_URL = `https://www.sanity.io/@${SANITY_ORG_ID}/studio/${STAGING_STUDIO_DEPLOYMENT_ID}/`
const STAGING_APP_URL = `https://www.sanity.io/@${SANITY_ORG_ID}/application/${STAGING_APP_DEPLOYMENT_ID}/`
```

Document why hard-coded in a JSDoc block above the constants so future readers understand it isn't an oversight.

## Reference implementations in this repo

The Coach production placeholder uses this exact pattern in two paired files — keep them visually identical when iterating:

- `sdk-apps/coach/src/App.tsx` — Coach SDK app coming-soon
- `studios/coach/plugins/ComingSoonLayout.tsx` — Coach Studio coming-soon

Mirror the pair when producing a new placeholder for another app/Studio so the SDK app and Studio always render the same thing.

## Anti-patterns

- **Don't** redeclare the dot-texture data URI inline. Always import `TEXTURE_PATTERN_DARK` (or its hooks) from `@os-apps/ui/utils/texture`.
- **Don't** wrap content in `@sanity/ui` `Card` / `Heading` / `Button` components for these screens — they introduce light/dark theme switching and chrome that conflict with the always-dark hero treatment. Inline `<a>`, `<h1>`, `<p>`, `<main>` instead.
- **Don't** add Tailwind classes if the target is a Studio (`studios/*`) — Studios don't bundle Tailwind. Inline styles work in both surfaces.
- **Don't** make the headline a long sentence — 2–3 words max. Lead with a short statement, expand in the body paragraph.
- **Don't** use brand accent colours (orange, blue, magenta) for the buttons or text — this treatment is monochrome by design. Save accents for stat tiles and badges elsewhere.
- **Don't** load schemas / routes / contexts in the host file. The placeholder's value is a tiny bundle; reach for `schema: { types: [] }` and a stripped `defineConfig` / bare `App.tsx`.
