/**
 * MIGRATION TEMPLATE — rename rich-table row items from `richTableRow` to `row`
 * ============================================================================
 *
 * Context (SYS-141)
 * -----------------
 * The plugin previously registered the row object type as `richTableRow` while
 * its array member wrote items to content as `_type: 'row'`. That mismatch broke
 * `sanity graphql deploy` ("anonymous inline object"). The fix registers the type
 * as `row` so it matches the `_type` already stored in content.
 *
 * DO YOU NEED THIS MIGRATION?
 * ---------------------------
 * Almost certainly NOT. Rows created by this plugin have ALWAYS been stored as
 * `_type: 'row'`, which is exactly what the renamed type registers — so existing
 * content keeps working with no changes.
 *
 * Only run this if you have unusual content that stored rows as
 * `_type: 'richTableRow'` (e.g. hand-authored documents, an import script, or a
 * custom schema that referenced `type: 'richTableRow'` directly). This migration
 * rewrites any such items to `_type: 'row'`.
 *
 * (If instead you referenced the `richTableRow` *schema type name* in your own
 * studio schema, that's a code change, not a content migration: replace
 * `type: 'richTableRow'` with `type: 'row'`.)
 *
 * HOW TO RUN
 * ----------
 * 1. Copy this file into your Studio at:
 *      migrations/rename-richtablerow-to-row/index.ts
 * 2. Dry run (no writes — always do this first and inspect the output):
 *      npx sanity migration run rename-richtablerow-to-row \
 *        --project <projectId> --dataset <dataset>
 * 3. Apply for real:
 *      npx sanity migration run rename-richtablerow-to-row \
 *        --project <projectId> --dataset <dataset> --no-dry-run
 *
 * Docs: https://www.sanity.io/docs/schema-and-content-migrations
 */
import {at, defineMigration, set} from 'sanity/migrate'

const FROM_TYPE = 'richTableRow'
const TO_TYPE = 'row'

export default defineMigration({
  title: 'Rename rich-table row items from `richTableRow` to `row` (SYS-141)',

  // Optional: narrow the scan to the document types that embed rich tables to
  // make the migration faster. Leave commented out to scan every document.
  // documentTypes: ['page', 'post', 'article'],

  migrate: {
    // Runs for every object node in every document, including nested array items.
    object(node) {
      if (node._type === FROM_TYPE) {
        return at('_type', set(TO_TYPE))
      }

      return undefined
    },
  },
})
