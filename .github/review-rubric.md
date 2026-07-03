# PR Review Rubric

Repo-specific rules the Claude review agent enforces for **sanity-plugin-rich-table**
— a Sanity **Studio plugin** built around a `richTable` schema type, a
`richTableBlock` Portable Text block, custom Studio input components, and a
Portable Text editor (`@portabletext/editor`) with toolbar, slash commands,
emoji picker, and link/annotation plugins.

Review with that lens — a Studio plugin published to npm, not a generic web app
and not an SDK app. Each finding must cite a file + line, name the rule, and
propose a concrete fix. Skip what prettier / eslint / tsc already cover — the
agent's job is judgement.

---

## 1. Hard rules (flag every violation)

### Sanity document operations

- **`useDocumentOperation` must pass the version/release id as the third arg.**
  Every call must be
  `useDocumentOperation(getPublishedId(_id), _type, getVersionFromId(_id))`.
  Omitting the third arg makes patches default to `drafts.<id>`; when the
  document is edited inside a **content release** a `versions.<releaseId>.<id>`
  already exists, so `patch.execute` **crashes the Studio** with *"there is
  already a version of a document for published ID …"* (Linear SYS-138 /
  SYS-136). `getVersionFromId` (from `sanity`) returns `undefined` for plain
  draft/published ids, so passing it unconditionally is backward-compatible.
  **Never hardcode `drafts.`.** Audit every new call site.

### Schema definitions

- **Use the `define*` helpers.** Schema types use `defineType`, fields use
  `defineField`, array members use `defineArrayMember`. Flag raw object
  literals for schema definitions — they lose type-safety and autocompletion.
- **Array members carry `_key`.** Table rows and cells are array items. Any
  code that inserts/builds array members must generate a stable `_key` (use the
  existing `generateKey` util — see §4), and array patches must use `insert` /
  `setIfMissing` correctly. Flag a new array item created without a `_key`.
- **Plugin entry uses `definePlugin`.** Any new plugin export must be wrapped in
  `definePlugin`, not a bare config object.

### Custom input components (`src/components/**`, `src/portable-text/**`)

- **Patch through the form, never mutate `value`.** Custom inputs must emit
  changes via the `onChange` prop with `PatchEvent` + `set` / `unset` /
  `insert` / `setIfMissing` (or the `useDocumentOperation` patch handle).
  Flag direct mutation of the `value` object/array or writing fetched state into
  local `useState` that shadows the document value.
- **Read document/form context via hooks**, e.g. `useFormValue`, not by
  threading the whole document down through props.
- **Memoize patch handlers and editor config** passed to children / the PTE.
  Handlers built inline on every render (`onChange={() => patch(...)}`) and
  un-memoized editor `schemaDefinition` / behavior arrays cause editor remounts
  and lost focus. Use `useCallback` / `useMemo`.

### Package + tooling

- **pnpm only.** Any `npm`, `npx`, or `yarn` in scripts, docs, README, or CI is
  a bug. Use `pnpm` / `pnpm dlx`.
- **PR base = `main`.** This repo releases off `main` via semantic-release;
  conventional-commit titles matter (commitlint runs). Flag a non-conventional
  commit/PR title that will land in the changelog.

---

## 2. Theming, UI, and accessibility (judgment-based)

Flag a **real** concern, not a speculative one. If unsure, skip the finding.

### Theming (dark + light mode is a shipped feature)

- **No hardcoded colors.** No string-literal hex (`#fff`, `#1a1a1a`), `rgb()`,
  or named CSS colors in components or `styled` blocks. Pull from the
  `@sanity/ui` theme (`theme.sanity.color.*`, `tones`, `Card tone=...`) or
  styled-components theme tokens so dark/light mode keeps working. Flag any new
  literal color.
- **Prefer `@sanity/ui` primitives** (`Box`, `Flex`, `Stack`, `Card`, `Text`,
  `Button`, `MenuButton`, `Dialog`, `Tooltip`) over hand-rolled divs with
  inline styles. Reuse before adding a parallel styled component.

### React lifecycle / cleanup

- **`useEffect` that adds a listener without cleanup.** `addEventListener`,
  editor event subscriptions (`EventListenerPlugin`), intervals/timeouts,
  `floating-ui` autoUpdate — every one needs the matching cleanup in the
  effect's return.
- **Unstable deps causing re-subscription / remount** — listeners or editor
  plugins re-registering every render because a dep is a fresh object/array
  each time. Memoize the dep.

### Accessibility

- New `<button>` / `[role="button"]` (row & column context-menu triggers, table
  buttons) without a keyboard handler or an accessible name (`aria-label` /
  visible text).
- New dialog / popover / floating panel (`Dialog`, `AnnotationDialog`,
  `FloatingPanel`, slash-command & emoji listboxes) without focus management —
  focus trap on open and focus restore on close, `Escape` to dismiss, and
  correct `role` / `aria-activedescendant` for the listbox pattern.
- New form input without an associated label / `aria-label`.
- `outline` removed without a replacement focus style.

---

## 3. Tests

This repo has a real vitest suite under `src/__tests__/` mirroring the source
tree (hooks, schemas, portable-text configs & renderers, utils).

- **New non-trivial logic** (a new hook, util, schema definition, PTE config, or
  renderer) without a co-located test under `src/__tests__/` — flag and ask for
  at least the happy path plus one or two edge cases. Exception: trivial
  wrappers and pure re-exports.
- **Behavior change to an existing unit that already has a test** without a
  corresponding test update — flag the stale coverage.

---

## 4. Reuse expectations

Before commenting "looks good", scan the diff for local re-implementations of
things that already exist. Name the existing export path in the comment.

- **Hooks** — `useAddRow`, `useAddColumn`, `useToggleTitles` (`src/hooks/`).
  Don't re-derive row/column mutation logic inline.
- **Utils** — `generateKey` (array `_key`s), `getLetterBasedOnIndex` (column
  letters), `looksLikeUrl` / `looks-like-url`, `matchEmojis`,
  `isRichTableArrayMemberContext`, `onKeyDownSelect`. Flag a parallel
  implementation of any of these.
- **Components** — table primitives (`Table`, `TableGrid`, `TableButtons`,
  `RichTableItem`, `ColumnHeaderWithInput`, `RowHeaderWithInput`), context menus
  (`ColumnContextMenu`, `RowContextMenu`), dialogs
  (`ConfirmClearTableDialog`, `ExpandedTableDialog`), and the PTE building
  blocks under `src/portable-text/`. Extend, don't duplicate.
- **Portable Text config pattern** — editor extensions live in
  `src/portable-text/configs/extend*.tsx` and render maps in
  `configs/renderer/render*.tsx`. New decorators / styles / annotations /
  blocks should follow this pattern, not be inlined into the editor component.

---

## 5. Soft checks (call out only if material)

- Exported plugin APIs, public hooks/components, and exported types without
  TSDoc explaining **what and why**.
- Schema fields where the purpose isn't obvious from the title and there's no
  `description`.
- Commit messages that explain **what** instead of **why**.
- A specialised solution (custom editor behavior, live subscription, custom
  Studio input) being deleted or rewritten without a consumer audit.

---

## 6. Out of scope

- Formatting (prettier) and lint (`pnpm lint`).
- Type errors and build failures (`pnpm build` / `prepublishOnly` in CI).
- Subjective naming preferences.
- Anything needing runtime verification in a live Studio — defer to the human
  reviewer.

---

## When this file grows

If the auto-review repeatedly misses or over-fires on something, edit this file
in a follow-up PR. The rubric is the **only** place to add review-time rules —
adding them in the workflow prompt makes them invisible.
