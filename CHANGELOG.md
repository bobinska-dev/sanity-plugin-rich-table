<!-- markdownlint-disable --><!-- textlint-disable -->

# 📓 Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.2.0](https://github.com/bobinska-dev/sanity-plugin-rich-table/compare/v2.1.3...v2.2.0) (2026-07-08)

### Features

- **dev:** hint in console when the nested-editor compiler-runtime bug hits ([66b25bf](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/66b25bf16708c967308fbf857b4d8b2ba7f26a97))

## [2.1.3](https://github.com/bobinska-dev/sanity-plugin-rich-table/compare/v2.1.2...v2.1.3) (2026-07-07)

### Bug Fixes

- **diff,schema:** absent title flag = off; honour explicitly-empty PT groups ([5fa4119](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/5fa4119bd8ee3027e0b41bb221e9902de6995254)), closes [#8](https://github.com/bobinska-dev/sanity-plugin-rich-table/issues/8) [#9](https://github.com/bobinska-dev/sanity-plugin-rich-table/issues/9)
- **import:** harden markdown + CSV parsing edge cases ([87354e4](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/87354e4fd0356c4b152a7c5a4ba2224fc901e04a)), closes [#12](https://github.com/bobinska-dev/sanity-plugin-rich-table/issues/12) [#13](https://github.com/bobinska-dev/sanity-plugin-rich-table/issues/13) [#14](https://github.com/bobinska-dev/sanity-plugin-rich-table/issues/14)
- **import:** reject control-char scheme bypass in pasted link hrefs ([09d20db](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/09d20db3950423e93db209d5198292211da10e40))
- **import:** skip non-content tags and preserve heading levels in HTML paste ([f9ca4d6](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/f9ca4d6705121fdeef0bc2e241b6432c34cea74f)), closes [#11](https://github.com/bobinska-dev/sanity-plugin-rich-table/issues/11) [#15](https://github.com/bobinska-dev/sanity-plugin-rich-table/issues/15) [#10](https://github.com/bobinska-dev/sanity-plugin-rich-table/issues/10)
- **pt:** add-column in a single atomic transaction ([142a57a](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/142a57aa9d9fdecd1db1ce60f0db8298f2143609))
- **pt:** catch INDIRECT recursive cell schemas, not just direct ([3ad3e6b](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/3ad3e6b8370a982b4e1866452e5cbae08413e1da))
- **pt:** clear table by unsetting its fields, not the whole path ([90b84ac](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/90b84acbce5c2c4685ba5d1ab7501127f11e8346))
- **pte:** sync external cell value changes without disrupting typing ([9ec2e4f](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/9ec2e4fccb6076c4e8af6556a175520aacaecd2e)), closes [#2](https://github.com/bobinska-dev/sanity-plugin-rich-table/issues/2)
- **review:** flush external cell sync on blur; stop stripping href spaces ([2ff764b](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/2ff764b66b8809f424b72b5712ac8b5dc3f6ecc7)), closes [#40](https://github.com/bobinska-dev/sanity-plugin-rich-table/issues/40)
- **table:** dedupe drag-commit, fix picker CSS, guard sheet parse ([fde0191](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/fde01913b9a1fcb0e375d2d18456119aa8a18ced))
- **ui:** no-arg richTablePlugin, emoji focus guard, item double-toggle, tooltip ([012f206](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/012f20691ff1a29698f0bc37b7da57e8f1ad7eaa))

### Performance Improvements

- **table:** memoize cells so editing one doesn't re-render the rest ([#18](https://github.com/bobinska-dev/sanity-plugin-rich-table/issues/18)) ([ceee694](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/ceee69437e53d0c949c59ec5a5660fbf0109c4df))

## [2.1.2](https://github.com/bobinska-dev/sanity-plugin-rich-table/compare/v2.1.1...v2.1.2) (2026-07-07)

### Bug Fixes

- **import:** auto-detect the richTableBlock member for paste-to-import ([4e15034](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/4e1503410e3658f05366991a5fd09c79df56c925))
- **pt:** resolve cell content schema from the cell's own field, not a threaded prop ([65d1758](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/65d175842c697be0a0f5e5a51cebf3fe6abf1a5a))

## [2.1.1](https://github.com/bobinska-dev/sanity-plugin-rich-table/compare/v2.1.0...v2.1.1) (2026-07-07)

### Bug Fixes

- generateKey uses globalThis.crypto so public exports work in Node/SSR ([46a9020](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/46a90209afb5ab500898a5e87870aa3e523edf5d))
- **pt:** keep editor focus on slash-picker mousedown so click-to-insert works ([6f01ca5](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/6f01ca5cfb79f6880ff03893258763396b481670))
- **pt:** log every table component crash and contain it at the table level ([24581d7](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/24581d7d00fdef1b9a6616ef351d1fcadb2e4e14))

## [2.1.0](https://github.com/bobinska-dev/sanity-plugin-rich-table/compare/v2.0.0...v2.1.0) (2026-07-07)

### Features

- **pt:** add findRecursiveCellType guard for recursive cell schemas ([6d5db4c](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/6d5db4c84456e4c95f0e752d1144390cafb55f96))
- **pt:** add toMarkdownTable — serialize a richTable to a GFM Markdown table ([12e90fe](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/12e90fef60d193452a516042e340c97a1ec899fe))

### Bug Fixes

- **migration:** replace the broken \_type migration with an export/import script ([6d75fd5](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/6d75fd5a0899243030f71d2190e6d611cd8a1495))
- **pt:** address PR review — pnpm-only migration script, stable blur handler ([fb9c813](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/fb9c813ed061afe62379e4eaa027e80621dbdec8))
- **pt:** dismiss the slash-command picker when the editor loses focus ([4cc2e47](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/4cc2e47d37399fd1681835b28f23b6c1e5cdb3bb))
- **pt:** memoize the slash-picker blur handler with useCallback ([bd16319](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/bd16319a9b3309780da8d6420034ba6f50a4b8de))
- **pt:** reuse extendsType for reference-block routing ([9459de3](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/9459de35e6d462e207c8d37c353d08980910efb2))
- **pt:** route named image blocks by base type and harden default block media ([050e282](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/050e2827ac2fac7eae670d4edbc1cdb62448bafc))
- **pt:** thread portableTextSchemaTypeName through richTableBlock body tables ([0204435](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/0204435ea304125843c82caec0f31e7bc289d550))
- **pt:** wrap each cell in an error boundary so one bad cell can't crash the table ([82f0ed5](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/82f0ed507fa631c80f8e924fd1fa25d95d724326))

### Performance Improvements

- enable the React Compiler at build time ([6a6b20f](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/6a6b20f921c2a5867cd97742ebea628e64522c1f))

## [2.0.0](https://github.com/bobinska-dev/sanity-plugin-rich-table/compare/v1.2.2...v2.0.0) (2026-07-06)

### ⚠ BREAKING CHANGES

- **pt:** table slots on all block types; drop customBlockTypes options

### Features

- add reference block support and update dependencies ([df958df](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/df958dfd61694e7be54b5533a7e7e68de5ba19f5))
- custom plugin config and component updates ([6595e86](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/6595e86a1374994b308710ccd6763e33aff0bb3b))
- **diff:** port rich table Review-changes diff to the v6 cell-PT line ([a4a4228](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/a4a4228e7c1ba35dff76f05f51f8b65434b855dd))
- **diff:** show inline before→after diff for rich table cells ([40cb69e](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/40cb69eb5c35de399c1beb20552330acb34a326d))
- enhance custom block rendering with improved media display and new image field ([b320a0a](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/b320a0a54096ac8164644f0a04ef7ae4373c2fb2))
- enhance rich table plugin with custom block support and UI improvements ([7e171af](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/7e171af8b68d9bb5610e66c91189743690af4386))
- **import:** native table import (field action, inline button, paste) ([c79b653](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/c79b653cebbdbf286f56624685cbbeaec1aaf295))
- make resize handles discoverable and show "resize all" on Shift-drag ([2e2d86a](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/2e2d86af8e0d746c059adbe090dd0f94c4bcfbe0))
- **pt:** add inline-object insert buttons to the cell toolbar ([24215f4](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/24215f4d341780479dbea785b9f8e1bf3c38a05e))
- **pt:** default inline-object renderer, overridable via tableInlineBlock ([3da4ff4](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/3da4ff41bbf97ce8c5d01e4d5eb3d834e2231ff9))
- **pt:** edit annotations & inline objects via the native document form ([36c9d29](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/36c9d29ed7d6c02476b931bd6f688a45c6e48b64))
- **pt:** fully customisable cell PTE — schema-driven marks + render components ([eb65db1](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/eb65db10289bee792161ef1c453624936ad80eaf))
- **pt:** make styles/decorators/annotations/lists schema-driven ([a238aa6](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/a238aa6fa987b43b964f09076314a414aca11fc4))
- **pt:** make the slash-command picker schema-driven and vertical ([60c89b6](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/60c89b650ce16f7bdeda5008ef360ad939205479))
- **pt:** render cell annotations via a tableAnnotation sibling slot ([a1efd5e](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/a1efd5ed210309d61c7a3799c12b6fffaccea21b))
- **pt:** render custom inline objects in cells via components.inlineBlock ([b4649ef](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/b4649efaa8b78b3782a397f79c1d3087316317ea))
- **pt:** table slots on all block types; drop customBlockTypes options ([940352c](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/940352c242ed96c74163626e1f493f63d93c39c5))
- resize table columns via header drag handles ([37ab3d1](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/37ab3d10b33b6012849dec89e8f18f10f6846512))
- resize the row-title column too ([adb8d6b](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/adb8d6bc74b28367eba41f82799335e2a9dfe5fe))
- **studio:** allow mailto and tel schemes on customPT link annotation ([907529e](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/907529e9688d79421a37ea7ea0e3ca465142ea0c))
- **table:** drive expanded editor modal state via Structure URL params ([3903e2e](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/3903e2e2509ee00c6fe773a7f61147849f5cfc68))
- **table:** promote first row/column to headers from the context menu ([70ccec0](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/70ccec0d5bf6a69d7240cf592e38a9d85146e7e8))
- **table:** schema-defined per-table validation via richTableRules ([0eaa462](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/0eaa462496f5b2e6d1aa8770a177da51c9bea91a))
- update ReferenceBlock and renderBlock for improved image handling and clean up TODO comments ([80beb70](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/80beb708b2eead85d3dbe3849c35dd8fdfd06b95))

### Bug Fixes

- **a11y:** make selection popovers keyboard-accessible ([42b9327](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/42b932707e6077c52d314cb02e31d59194b036f3))
- **a11y:** make table ARIA-navigable and fix control accessibility ([45b6f54](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/45b6f54e6b9f7ec22caafa9f037f70073b13c789))
- **a11y:** move focus into the selection popover on Tab ([6cdb7e8](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/6cdb7e83fc593a05c362bd51a525a00266d62157))
- **a11y:** namespace context-menu ids, drop unused cell id (review) ([3c8c06c](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/3c8c06ce21206c161c07a0e7ecc46c500118e989))
- address PR review — guard column widths and harden reconciliation ([487e0f8](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/487e0f87ed467772d94aa55efc28d79ee4efd093))
- align resize handle to the column separator and make it clearer ([5aee299](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/5aee299818c0890aac1d85ad80cf14b05e3e5305))
- **ci:** move pnpm overrides to pnpm-workspace.yaml for pnpm 11 ([283f2ad](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/283f2ad86d6e8acdbf0e943fff24d5bd32470eed))
- CSV/markdown parser edge cases + tests for v2 surfaces ([7f65845](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/7f658451f1a463d2028aadb7a58495df5e40e2b0))
- **deps:** dedupe React to one version to stop useMemoCache errors ([4030acc](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/4030accab35d34a12b54c3065e3e7576b486ad78))
- **deps:** pin vitest to 4.1.9 to pass the pnpm 11 release-age gate ([1d2e879](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/1d2e8794396ebef86b368320ab19ac8ea09e066e))
- **deps:** require React 19 peer to align with Sanity v6 and PT toolbar ([868a15f](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/868a15ffe530c17d55ad4f03e1cb4baaad1da202))
- diff column key fallback + centralize diff/critical tint colors ([4dcb22d](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/4dcb22de46a07e83bce36b01d789a9c7e5c7cb99))
- focus the resize handle on click so arrow-key resizing works ([d189358](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/d1893581de28bb1a48b35a57915daac7e677d9cb))
- give the row-title column a min width so titles aren't hidden ([0078bbf](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/0078bbf93b30156407efb67f0bc694645b8d80f3))
- **import:** address review — richTableBlock PT type + no eager xlsx load ([0ac8fb3](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/0ac8fb3327d9b646b05329862e11b29772006a84))
- **import:** detect plain column headers in a labeled-matrix HTML table ([a7c4ce5](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/a7c4ce5c4bbd010907a383adaa975c33303967e6))
- **import:** use npm-registry xlsx@0.18.5 for lockfile integrity ([39148a7](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/39148a7a63fa504a5f9a418a541c6957351cbc5f))
- **pickers:** keep arrow-key scrolling inside the picker, not the viewport ([6941e90](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/6941e90fb75ceb0c80abf6811ef934c5672ed037))
- **pickers:** reveal the last/first option fully when arrowing to an edge ([d10ba6e](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/d10ba6e20b7ea2f80a71767c5a162e3782c45d8a))
- **pt:** align slash-command picker icons with the toolbar ([a194cf4](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/a194cf4839f24f4654e2266928171cca7c249c14))
- **pt:** align slash-command rows with a fixed icon gutter ([1215abe](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/1215abeb0ce7b2649a0544eba61218b408377ced))
- **pt:** built-in cell fallbacks render real previews and open on double-click ([01ac7c2](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/01ac7c268f5cf9da40b6b6c59b33c445f435ee61))
- **pt:** collapse the native member-edit dialog stack to the innermost ([eef8bd0](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/eef8bd09ca22c632db07f3dfa53f9c5f2abfcb0f))
- **pt:** edit inline objects via a tableInlineBlock sibling slot ([7e73651](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/7e736515b4207eff47336c6af9743c39c47c5292))
- **pt:** make custom inline objects selectable and show their toolbar icon ([0a07e96](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/0a07e9604147ecd8f089f3cf5d0f947453012043))
- **pt:** wrap slash-command row labels in Box so lines stack ([8ab28f5](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/8ab28f5f9198b4acf5f12f186ad16cd211fe394b))
- QA a11y + schema hygiene, rename DefaultCustomBlock ([db45c0b](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/db45c0b37bed055349bc013739810edd21fb9266))
- QA high/medium — readOnly sync, HTML span/nesting/href, leaks, dup keys ([2521ed6](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/2521ed6d45a86312d5fb602d400b26314953d9b2))
- review — autoFocus safe dialog action + consolidate key generation ([c1c72d5](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/c1c72d5a6bb2e823d6bbb0d331ee76193be485f1))
- **studio:** remove invalid nested-array member from customPT dev schema ([49d3658](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/49d36583ec8168cc0a1e567a40480a825d59d796))
- **table:** detect array-member context by path, not schema walk ([11862a2](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/11862a2893ed4d85f261ea602c344d5247337de2))
- **table:** give initial cells fully-keyed Portable Text values ([1068547](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/106854726a78eddf18fc6f5fbf8b66d4c9d0c253))
- **table:** preserve \_type/\_key when initialising a table in PT or an array ([ca095a6](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/ca095a6322cdc251839067183b3e6f6560aefdfd))
- **table:** preserve array-item \_key when initializing a renamed richTable member ([5584e53](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/5584e5376c844cfbfd39c1ee32c0f54c3cfdfd15))
- **table:** QA polish — row-title undo/redo, clear-dialog tones, schema hygiene ([0b6cea7](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/0b6cea7a955f511c43e3804cf83c3d194e604fa3))

### Performance Improvements

- **pt:** adopt native PT plugins + v6 APIs, drop hand-rolled code ([dc6835c](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/dc6835c19a9b911fc78ddffb702e0f7920656ef7)), closes [#2](https://github.com/bobinska-dev/sanity-plugin-rich-table/issues/2) [#3](https://github.com/bobinska-dev/sanity-plugin-rich-table/issues/3)

## [1.2.2](https://github.com/bobinska-dev/sanity-plugin-rich-table/compare/v1.2.1...v1.2.2) (2026-07-06)

### Bug Fixes

- **deps:** declare sanity/react/styled-components as peerDependencies ([bc40fd7](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/bc40fd7cdfc5adaac3f88ee2e2d23cda25695bfe)), closes [#10](https://github.com/bobinska-dev/sanity-plugin-rich-table/issues/10) [#10](https://github.com/bobinska-dev/sanity-plugin-rich-table/issues/10)

## [1.2.1](https://github.com/bobinska-dev/sanity-plugin-rich-table/compare/v1.2.0...v1.2.1) (2026-07-06)

### Bug Fixes

- keep diff grid valid when a table has no columns ([388161d](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/388161dddde50548425b989627765df897c569b5))

## [1.2.0](https://github.com/bobinska-dev/sanity-plugin-rich-table/compare/v1.1.5...v1.2.0) (2026-07-03)

### Features

- render rich table diffs in the review changes pane ([3f631c0](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/3f631c05589042e62242e48efc10a5c71b533deb))

### Bug Fixes

- convey cell status in diff inspect aria-label; cover preview guard ([b51a3de](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/b51a3dee3b3d31b7371e2ed38b00d2701815e3cc))

### Performance Improvements

- memoize rich table diff model computation ([5b43d74](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/5b43d7499404278b84b6253eba18d23ac749a387))

## [1.1.5](https://github.com/bobinska-dev/sanity-plugin-rich-table/compare/v1.1.4...v1.1.5) (2026-07-03)

### Bug Fixes

- **table:** keep \_type/\_key when initialising a table + key all cell content ([7e10414](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/7e10414ff2bae78a4279920d273436c3aad4d3c6))

## [1.1.4](https://github.com/bobinska-dev/sanity-plugin-rich-table/compare/v1.1.3...v1.1.4) (2026-07-03)

### Bug Fixes

- register row schema type as row so graphql deploy works (SYS-141) ([4029dbf](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/4029dbfea5165d6c508ea79da1bf4665edae50ea))

## [1.1.3](https://github.com/bobinska-dev/sanity-plugin-rich-table/compare/v1.1.2...v1.1.3) (2026-07-03)

### Bug Fixes

- initialise nested rich table fields without absolute-path patch ([f83f7e5](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/f83f7e52bdeb14649d76cbf742de47dbaa6d22b2))

## [1.1.2](https://github.com/bobinska-dev/sanity-plugin-rich-table/compare/v1.1.1...v1.1.2) (2026-07-03)

### Bug Fixes

- target edited release version in useDocumentOperation (SYS-138) ([85e400c](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/85e400c97717ec2a766b39d2d6744f417cecc893))

## [1.1.1](https://github.com/bobinska-dev/sanity-plugin-rich-table/compare/v1.1.0...v1.1.1) (2026-04-09)

### Bug Fixes

- update rich table plugin for improved functionality in arrays ([3fd08bd](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/3fd08bda0a9d80a0c1b3410ee8d02037a4c19c12))

## [1.1.0](https://github.com/bobinska-dev/sanity-plugin-rich-table/compare/v1.0.5...v1.1.0) (2026-03-04)

### Features

- upgrade @portabletext/\* dependencies for Sanity 5.x compatibility ([4bc7b79](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/4bc7b7999e8a8d909690665795e4d6c9e97cd46a))

### Bug Fixes

- use JSON import assertion for emojilib to fix ERR_IMPORT_ASSERTION_TYPE_MISSING ([d45f033](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/d45f033dfd698faecba74c5056bda402ef6bbf68))

## [1.0.1](https://github.com/bobinska-dev/sanity-plugin-rich-table/compare/v1.0.0...v1.0.1) (2026-02-16)

### Bug Fixes

- relax peer dependency version requirements ([ceea825](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/ceea8254b3ed1802775792bd3b42f22cc752ae1c))
- update @portabletext/\* dependencies to latest versions ([040f6f8](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/040f6f8863329736de5a14490ff58289325ca187))

## 1.0.0 (2026-02-16)

### Features

- add default option to merge cells in table input for improved usability ([52e5f50](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/52e5f50bbf9ce15891d5a94cb20e2783c013f4ab))
- add schemaTypeName prop to InitialiseTable and RichTableInput components ([c684a6a](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/c684a6aded146a83e09b951660f02ad90b3a4477))
- add title and cursor style to Card component in RichTableBock for improved user interaction ([e6ea294](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/e6ea2941b2a8bdcadd9895834875b169e7032b5b))
- enhance accessibility and aria attributes across components for improved screen reader support ([2ac0c0c](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/2ac0c0c97534f0b422464de3d31db086c39f3083))
- export TableSize type for improved type usage in onKeyDownSelect ([95b1790](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/95b1790406fab4dc16f4b90b8c10f3732d2a54ac))
- integrate Markdown shortcuts plugin and enhance list item rendering in portable text editor ([f210bba](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/f210bba6847d1cbd1aa2631b95d54048d0bd35d4))
- update column handling in ColumnContextMenu and InitialiseTable for improved cell index management ([d62da3d](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/d62da3d541140848f38d4755d40937e1dc947a2c))

### Bug Fixes

- add missing deps, change package to esm ([2645629](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/2645629e5d342636ae37a84bf52114f7899d0f37))
- remove bad import ([642748a](https://github.com/bobinska-dev/sanity-plugin-rich-table/commit/642748ad8fb6dc996f2fc2f08fdab14a7309399d))
