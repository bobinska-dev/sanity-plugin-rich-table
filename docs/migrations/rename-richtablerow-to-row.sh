#!/usr/bin/env bash
#
# MIGRATION — rename rich-table row items from `_type: "richTableRow"` to `"row"`
# =============================================================================
#
# Context (SYS-141)
# -----------------
# The plugin previously registered the row object type as `richTableRow` while
# its array member wrote items to content as `_type: 'row'`. That mismatch broke
# `sanity graphql deploy` ("anonymous inline object"). The fix registers the type
# as `row` so it matches the `_type` already stored in content.
#
# DO YOU NEED THIS?
# -----------------
# Almost certainly NOT. Rows created by this plugin have ALWAYS been stored as
# `_type: 'row'`, which is exactly what the renamed type registers — so existing
# content keeps working with no changes. Only run this if you have unusual
# content that stored rows as `_type: 'richTableRow'` (e.g. hand-authored
# documents, an import script, or a custom schema that referenced
# `type: 'richTableRow'` directly).
#
# WHY A SHELL SCRIPT AND NOT `sanity migration run`?
# --------------------------------------------------
# Because `_type` is an IMMUTABLE attribute (like `_id`, `_createdAt`,
# `_updatedAt`, `_rev`): the Content Lake refuses to change it with a mutation,
# so a `sanity/migrate` script — e.g. `at('_type', set('row'))` — fails with:
#
#     Cannot modify immutable attribute "_type"
#
# Sanity's documented workaround is to export the dataset, edit the NDJSON, and
# re-import it with `--replace`. Import `--replace` rewrites each document
# WHOLESALE (a create-or-replace with the SAME `_id`), so the rows come back with
# the corrected nested `_type` — and because each document's own `_id`/`_type`
# are unchanged, no immutability rule is violated. (Note: this is a NESTED type
# change, so unlike a document-level `_type` change you do NOT delete/recreate
# any documents.)
#
#   https://www.sanity.io/docs/content-lake/schema-and-content-migrations
#   https://www.sanity.io/docs/cli-reference/cli-datasets
#
# WHAT THIS SCRIPT DOES
# ---------------------
# It is READ-ONLY against your dataset: it exports, then selects and rewrites the
# affected documents into LOCAL files, and finally PRINTS the exact `import`
# command for you to review and run yourself. Nothing is written back to your
# dataset until you run that final command.
#
# USAGE
# -----
#   1. Copy this file into your Studio project (so the Sanity CLI picks up your
#      projectId from sanity.cli.ts / sanity.config.ts).
#   2. Run it, passing the dataset name:
#        bash rename-richtablerow-to-row.sh <dataset>       # e.g. production
#   3. Review ./richtablerow-migration/fixed.ndjson, then run the printed
#      `sanity dataset import ... --replace` command.
#
# ALWAYS test against a throwaway copy first (see the tip printed at the end).

set -euo pipefail

DATASET="${1:?Usage: bash $0 <dataset>   (e.g. production)}"
FROM='"_type":"richTableRow"'
TO='"_type":"row"'
WORKDIR="richtablerow-migration"

mkdir -p "$WORKDIR"

echo "1/4  Exporting '$DATASET' (documents only, no assets)…"
npx sanity dataset export "$DATASET" "$WORKDIR/export.tar.gz" --no-assets --overwrite

echo "2/4  Unpacking the export…"
tar -xzf "$WORKDIR/export.tar.gz" -C "$WORKDIR"

echo "3/4  Selecting only the documents that contain a 'richTableRow' item…"
# Each NDJSON line is one whole document, so a fixed-string grep keeps exactly
# the documents that need fixing (published and drafts alike).
grep -F "$FROM" "$WORKDIR/data.ndjson" >"$WORKDIR/affected.ndjson" || true
COUNT=$(wc -l <"$WORKDIR/affected.ndjson" | tr -d ' ')
echo "     $COUNT document(s) affected."

if [ "$COUNT" -eq 0 ]; then
  echo "Nothing to migrate — every row is already stored as _type:\"row\". Done."
  exit 0
fi

echo "4/4  Rewriting $FROM → $TO …"
# `"_type":"richTableRow"` is a specific, unique token in Sanity's compact export
# JSON, so a literal replace only touches the type field.
sed "s/$FROM/$TO/g" "$WORKDIR/affected.ndjson" >"$WORKDIR/fixed.ndjson"

echo
echo "Done preparing. Review the rewritten documents:"
echo "    $WORKDIR/fixed.ndjson"
echo
echo "Then APPLY the change (this is the only step that writes to your dataset):"
echo
echo "    npx sanity dataset import \"$WORKDIR/fixed.ndjson\" \"$DATASET\" --replace"
echo
echo "TIP — rehearse on a throwaway copy of the dataset first:"
echo "    npx sanity dataset copy \"$DATASET\" \"${DATASET}-migration-test\""
echo "    npx sanity dataset import \"$WORKDIR/fixed.ndjson\" \"${DATASET}-migration-test\" --replace"
