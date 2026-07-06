---
name: portable-text-sanity-upgrades
description: Guides upgrading and refactoring this rich-table plugin's Portable Text editor and Sanity Studio integration — which native @portabletext/* API replaces which hand-rolled code, safe version-pin decisions (@sanity/icons, react-icons, pkg-utils peers), deprecations to avoid, and the verify loop. Use when bumping sanity / @portabletext/* / @sanity/* versions, reviewing PT or Studio code for stale patterns, or deciding whether to hand-roll something vs adopt a native API.
---

# Portable Text & Sanity modernization (rich-table plugin)

Use this when upgrading or refactoring this plugin's Portable Text editor or Sanity Studio
integration: deciding hand-roll vs native API, bumping `@portabletext/*` / `sanity` / `@sanity/*`,
or reviewing PT/Studio code for stale patterns.

**Ground rule:** verify an API against source before coding its name. Published READMEs/CHANGELOGs
in this ecosystem contain stale/aspirational names. Confirm exports in
`node_modules/.../dist/index.d.ts` or the package's `src/index.ts` on GitHub. Never invent API names.

## Already native — do NOT re-hand-roll

The plugin already adopts these. Reuse, don't reinvent:

| Concern | Native API in use | Where |
|---|---|---|
| Editor events (focus/blur/mutation) | `EventListenerPlugin` (`@portabletext/editor/plugins`) | `EventListenerPlugin.tsx` |
| Slash commands / typeahead | `defineTypeaheadPicker` + `useTypeaheadPicker` (`@portabletext/plugin-typeahead-picker`) | `pte-slash-commands/` |
| Emoji picker | `useEmojiPicker` (`@portabletext/plugin-emoji-picker`) | `emoji-picker/` |
| Toolbar state | `useToolbarSchema` + per-button hooks (`@portabletext/toolbar`) | `context-menu-toolbar/` |
| Markdown / list / paste-link | `MarkdownShortcutsPlugin`, `ListIndexProvider`, `PasteLinkPlugin` | `ContentPortableTextEditor.tsx` |
| Schema-driven styles/decorators/lists/annotations | `extend*` configs off the resolved block member | `configs/` |

The `EventListenerPlugin` wrapper is intentional: it bridges editor `mutation` events to
`useDocumentOperation().patch.execute` so nested-table patches hit the right perspective/release
(SYS-138). Keep the wrapper.

## Optimization opportunities (verified, prioritized)

1. **Replace `resolveSchemaDefinition.ts` (~140 lines + `@ts-ignore`) with the official converter.**
   `sanitySchemaToPortableTextSchema(sanitySchema)` from `@portabletext/sanity-bridge` converts a
   Sanity `ArraySchemaType`/`ArrayDefinition` → editor `SchemaDefinition`; feed it straight to
   `EditorProvider`'s `initialConfig.schemaDefinition`. For per-cell nested PT sub-schemas use
   `getSanitySubSchema`.
   - **Feasibility caveat:** `sanity-bridge` is NOT hoisted from `sanity` and editor 7.9 does not
     pull it — add it as a **direct dependency** (latest 3.2.0). It ships `@sanity/schema` /
     `@sanity/types` as regular deps (not peers), so no peer conflict, but confirm no duplicate
     `@sanity/types` major mismatch at build. The current converter works and is tested — this is a
     maintenance refactor, not a bug fix. Re-test the customPT dev schema after switching.
   - **DO NOT adopt on `feat/custom-plugin-config`.** That branch replaced the hand-rolled converter
     with `configs/extractBlockConfig.ts` — one typed extraction feeding BOTH the editor
     `SchemaDefinition` (`resolveSchemaDefinition`) and the toolbar (`createExtend*`), and it
     preserves per-mark `icon`. `sanitySchemaToPortableTextSchema` emits only the editor
     `SchemaDefinition` (`{name, title}`, no icons — icons are a toolbar-layer concern), so it can't
     replace `extractBlockConfig` and would re-fragment extraction into two paths. Prefer
     `extractBlockConfig` there; only revisit sanity-bridge if the icon/toolbar need goes away.

2. **Toolbar v8 `useApplicableSchema`.** v8's `useToolbarSchema` now returns the *union* schema,
   stable as the caret moves between cells with different sub-schemas (good for tables). Add
   `useApplicableSchema` (new in v8) to gate which buttons are *enabled* for the current selection.
   Button listeners batch in v8 — free perf on upgrade.

3. **Consider `@portabletext/plugin-one-line`** for single-line cell editing if cells shouldn't allow
   block breaks. Track `@portabletext/plugin-table` (skeleton, unpublished) — it aims to be a shared
   table core across editor/Studio/Canvas and would overlap this plugin.

## Hard rules & version-pin decisions

- **`@sanity/icons`: stay on `^3` for now.** v4 = ESM-only + React 19 + Node ≥22.12; **v5 removes
  the root barrel** — every `import {X} from '@sanity/icons'` breaks (11 files here) and must become
  subpath `import {X} from '@sanity/icons/X'`. Icon set is identical v3↔v5. Only bump with a
  deliberate subpath-import migration.
- **Keep `react-icons`.** `@sanity/icons` has no table / H1–H6 / column-insert / row-remove icons —
  exactly this plugin's domain. Don't drop it.
- **pkg-utils `--strict` peers (v10):** peers = `sanity`, `react`, `react-dom`, `styled-components`
  only. `@sanity/ui`, `@sanity/icons`, `@sanity/client`, `rxjs`, `react-is` → `dependencies` (never
  peers). `@types/react|react-dom|node` → not deps; if peered, range must be `*`. Ship
  `"type": "module"` + ESM-only `exports`. `--strict` says nothing about `@portabletext/*` — keep
  them as regular `dependencies` (matches how `sanity` itself carries `@portabletext/editor`).
- **React peer floor is 19 on the v6 line.** `sanity` 6.3.0 peers `react ^19.2.2`; editor 7.9 /
  toolbar 8 peer `react ^19.2.7`. A `^18 || ^19` peer range can never actually be satisfied on 18 —
  tighten the plugin's `react`/`react-dom` peers to `^19` (`styled-components: ^6` is fine).
- **`@portabletext/*` singleton safety = version-range overlap with the Studio's bundled editor.**
  Sanity v6 bundles `@portabletext/editor ^7.9.0`; the plugin's range must overlap it. When Sanity
  bumps editor to a non-overlapping major, two copies appear → toolbar/context break → a new plugin
  major line. This is the root of the two-line (1.x/2.x) release strategy.
- **`useDocumentOperation(publishedId, type, version?)`** — always pass `getVersionFromId(_id)` as the
  3rd arg or Studio crashes inside content releases.

## Deprecations to avoid

- Editor: `PortableTextEditor` class, `usePortableTextEditor`, `usePortableTextEditorSelection` → use
  `useEditor()` / `useEditorSelector()` + `@portabletext/editor/selectors`.
- `PortableTextInputProps.markers` / `renderBlockActions` / `renderCustomMarkers` → use `renderBlock`.
- Old PT DOM classes `pt-*` → `data-pt-*` (Sanity 6.1.0). This plugin uses none — keep it that way.
- `@portabletext/sanity-bridge` README names `compileSchemaDefinitionToPortableTextMemberSchemaTypes`
  / `portableTextMemberSchemaTypesToSchema` — these DO NOT exist in 3.2.0. Don't code against them.

## Verify loop

After any PT/Sanity change:

```bash
npx tsc --noEmit
npx vitest run
npx pkg-utils build --strict --check --clean
cd studio && npx sanity build   # catches sanity auto-upgrade / peer breaks
pnpm dev                        # manual: toolbar, slash (/), emoji (:), nested table cells
```

## Reference

Full API/version audit + source URLs: [reference.md](reference.md).
