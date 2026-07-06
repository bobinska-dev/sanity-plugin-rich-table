<!-- markdownlint-disable --><!-- textlint-disable -->

# 📓 Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
