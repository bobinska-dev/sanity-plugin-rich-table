# Media Library changelog

Summarised from [sanity.io/docs/media-library/interface/changelog](https://www.sanity.io/docs/media-library/interface/changelog)
and [sanity.io/docs/media-library/introduction/changelog](https://www.sanity.io/docs/media-library/introduction/changelog).

## v2026-04-15 — Visibility toggle bugfix

Fixed an issue with the public/private visibility toggle on assets.

## v2026-04-13 — New sidebar pattern in collections interface

Collections UI updated to use a sidebar pattern for editing titles and
descriptions, consistent with the asset editing flow.

## v2026-02-26 — Improved filtering and reliable collection updates

- Asset list search renamed to "Find in view" with conditionally shown input.
- Empty filter/search results now show clear feedback with a reset option.
- Fixed rate-limit issue when adding many assets to a collection during bulk
  uploads; assets now load in batches with grid placeholders.

## v2026-01-07 — Responsive panels, sidebar popovers, private asset support

- Improved responsive panel behaviour on smaller screens.
- Sidebar uses popovers for tighter layouts.
- Private assets are now fully supported (requires token-based auth).

## v2025-11-26 — Redesigned aspects sidebar

Aspects sidebar redesigned for clearer editing. General improvements and bug
fixes.

## v2025-11-06 — Media Library asset functions

New Sanity Function type: `defineMediaLibraryAssetFunction`. React to asset
events (upload, update, delete) with event-driven functions. Requires
`@sanity/blueprints` v0.4.0+ and `@sanity/functions` v1.1.0+.

## v2025-10-29 — Enhanced preview experience

Improved asset preview and paste behaviour.

## v2025-10-15 — Enhanced previews and streamlined asset management

Better preview rendering and asset management workflows.

## v2025-09-24 — Improved filter UI, new filter facets, GDR document search

- Filter UI improvements.
- New filter facets for narrower searches.
- Document search added for global document reference aspects.
