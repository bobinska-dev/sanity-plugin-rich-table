# Reference: Sanity + Portable Text API/version audit

Snapshot: 2026-07-06. All versions the plugin targets are current-latest unless noted.
Verify names against source before coding — this ecosystem's docs lag its code.

## Latest versions (verified)

`sanity` 6.3.0 · `@portabletext/editor` 7.9.0 · `@portabletext/toolbar` 8.0.26 ·
`@portabletext/react` 6.2.0 · `@portabletext/sanity-bridge` 3.2.0 · `@portabletext/block-tools` 5.1.9 ·
`@sanity/ui` 3.3.2 · `@sanity/icons` 5.0.0 · `@sanity/pkg-utils` 10.9.0 · `@sanity/plugin-kit` 6.0.4

## @portabletext/sanity-bridge — the schema converter

- Exports (3.2.0, from dist): `sanitySchemaToPortableTextSchema`, `createPortableTextMemberSchemaTypes`,
  `getSanitySubSchema`, type `PortableTextMemberSchemaTypes`.
- `sanitySchemaToPortableTextSchema(sanitySchema)` accepts a compiled `ArraySchemaType` OR a raw
  `ArrayDefinition`; returns a `Schema` usable directly as `EditorConfig.schemaDefinition`.
- `getSanitySubSchema(...)` resolves the nested `{type:'block'}` sub-schema inside a container/object
  field (table cell, code block) with its own styles/decorators/annotations.
- Deps (regular, NOT peers): `@sanity/schema`, `@sanity/types`, `@portabletext/schema`, `lodash.startcase`.
- NOT hoisted from `sanity`; add as a direct dependency to use.
- README-only, do NOT use: `compileSchemaDefinitionToPortableTextMemberSchemaTypes`,
  `portableTextMemberSchemaTypesToSchema` (not in 3.2.0 code).
- Source: github.com/portabletext/editor/tree/main/packages/sanity-bridge

## @portabletext/toolbar v8

- Headless only — exports hooks, NO `<Toolbar>` component. Hand-render buttons.
- Hooks: `useToolbarSchema` (union schema, stable across selection), `useApplicableSchema` (applicable
  subset for the selection), `useDecoratorButton`, `useAnnotationButton`, `useAnnotationPopover`,
  `useBlockObjectButton`, `useBlockObjectPopover`, `useInlineObjectButton`, `useInlineObjectPopover`,
  `useListButton`, `useStyleSelector`, `useHistoryButtons`.
- v7→v8 breaking: `useToolbarSchema` returns the union (was the focus block's sub-schema); use
  `useApplicableSchema` for per-selection button gating.

## @portabletext/editor v7 — notable APIs

- Core: `EditorProvider`, `PortableTextEditable`, `useEditor`, `useEditorSelector`; selectors module
  `@portabletext/editor/selectors` (e.g. `getApplicableSchema`).
- Plugins `@portabletext/editor/plugins`: `EventListenerPlugin`, `EditorRefPlugin`, `BehaviorPlugin`,
  `NodePlugin`.
- Behaviors `@portabletext/editor/behaviors`: `defineBehavior`, `raise`, `effect`.
- Traversal `@portabletext/editor/traversal`: `getAnnotation`, `getContainerChildren`, `getNode`.
- Container pipeline (first-class tables/cells/code blocks): `defineTextBlock`, `defineContainer`,
  `defineBlockObject`, `defineInlineObject`, `defineSpan`, `resolveContainerAt`.
- `editor.on(type, listener, {batch: true})` coalesces a burst of events into one microtask.
- Render props unchanged: `renderBlock` / `renderStyle` / `renderDecorator` / `renderAnnotation` /
  `renderListItem`.
- Deprecated: `PortableTextEditor` class, `usePortableTextEditor`, `usePortableTextEditorSelection`.
- `defineSchema` (re-exported from `@portabletext/schema`) is for AUTHORING a schema by hand — it is
  NOT the Sanity-schema converter (that's `sanitySchemaToPortableTextSchema`).

## Ecosystem plugins

`plugin-one-line` 7.0.26 (single-line editor) · `plugin-dnd` 1.0.11 (drop position) ·
`plugin-typography` 8.0.26 (smart quotes/dashes) · `plugin-character-pair-decorator` 8.0.26 ·
`plugin-input-rule` 5.0.26 · `plugin-table` 0.0.22 (skeleton, unpublished) · `block-tools` 5.1.9
(HTML→PT) · `schema` 2.2.2 (`defineSchema`, `*SchemaType` types).

## Sanity v6 custom-input Form API

- `InputProps` union incl. `PortableTextInputProps extends ArrayOfObjectsInputProps`.
- Patch helpers from `sanity`: `set(value, path?)`, `unset(path?)`, `insert(items, pos, path?)`,
  `setIfMissing`, `PatchEvent`. Trailing `path` is relative to the current field.
- `ObjectInputProps` / `ArrayOfObjectsInputProps` expose `members[]` (each with resolved
  path/value/schemaType), `renderInput/Field/Item/Preview/Block/Annotation`, and array ops
  `onItemAppend/Prepend/Remove/Move`, `onPathFocus`. Prefer these over hand-built path/patch logic.
- `useClient({apiVersion})` — apiVersion required · `useFormValue(path)` — single-arg ·
  `useDocumentOperation(id, type, version?)`.
- `components` override keys (v6.3): `input`, `field`, `item`, `block`, `inlineBlock`, `annotation`,
  `diff`, `preview`, `portableText.plugins`.
- v6 baseline: React 19, Node ≥22.12, Vite 8, strict mode ON, `groq2024` search default. `sanity`
  depends on editor ^7.9, toolbar 8, sanity-bridge ^3.2. `@sanity/portable-text-editor` is gone from
  the tree (superseded by `@portabletext/editor`).
- Deprecated `PortableTextInputProps` members (still present, removed next major): `markers`,
  `renderBlockActions`, `renderCustomMarkers` → use `renderBlock`.

## @sanity/ui 3.x

- Stability line — no new Table/Toolbar primitive, no virtualization helper. Compose
  Grid/Flex/Card/Box/Stack + Popover/Dialog/Menu; `useToast`; `useGlobalKeyDown(handler, {options})`
  (added 3.1.0). 3.2.0 added deprecation warnings on Box/Grid `space`/`columns`/`rows` props.
- Peers: react/react-dom/react-is `^18 || >=19`, styled-components `^5.2 || ^6`. `@sanity/icons` and
  `@sanity/color` ship as regular deps.

## @sanity/icons v3→v5

- v4: ESM-only, `react ^19` peer, Node ≥22.12, `forwardRef` removed (ref-as-prop model).
- v4.1: subpath exports added (`@sanity/icons/Add`), root barrel deprecated.
- v5: root barrel named exports REMOVED — use `@sanity/icons/<Name>` (named + default) or the dynamic
  `<Icon symbol="add" />` / `icons` map (needs your own `<Suspense>`).
- Icon set identical across v3–v5 (236 icons, none added/removed; no table/grid/column/row/cell icon).
- Peers: `react ^19` only; zero runtime deps.

## pkg-utils --strict (v10.9)

- Peers: `sanity`, `react`, `react-dom`, `styled-components`.
- Must be `dependencies`, NOT peers: `@sanity/ui`, `@sanity/icons`, `@sanity/client`, `rxjs`, `react-is`.
- `@types/react` / `@types/react-dom` / `@types/node`: not deps; if peered, range must be `*`.
- `"type": "module"` + ESM-only `exports` (future versions require module type).
- React Compiler via `babel.reactCompiler` option + `babel-plugin-react-compiler` peer.
- `@sanity/plugin-kit` 6.0.4 template pins react peer to `^18` — widen to `^18 || ^19` yourself.

## Sources

- github.com/portabletext/editor (`packages/*/CHANGELOG.md`, `src/index.ts`) · portabletext.org
- github.com/sanity-io/sanity (CHANGELOG, releases) · sanity.io/docs
- github.com/sanity-io/ui · github.com/sanity-io/icons · github.com/sanity-io/pkg-utils
