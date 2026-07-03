# Rich Table — Data Structure

This document describes the data model used by the Rich Table plugin as defined by the project's Sanity schemas. It summarizes the object shapes, key fields, validations, and a small JSON example.

## Important background

When cells are created each cell will automatically receive a `content` array with one child. This child (type `PortableTextTextBlock`) has an empty `text` node. Unfortunately this is needed for the UI to play nice.

_**DO NOT REMOVE CELLS WITH EMPTY `CONTENT` FROM THE ARRAYS MANUALLY!**_

This means that an "empty" cell will still have a `content` field with an empty array. Consumers should check for the presence of content inside the `text` nodes to determine if a cell is truly empty.

## Where `richTable` lives in the document

- **Direct object field:** the stored value is the table object only (rows, column headers, flags). The Studio does not add a root `_type` or `_key` on that object by default.
- **Array of `richTable`:** each item is a keyed array member. When you initialise a table from the size picker in that context, the plugin stores the same fields as above **plus** root `_type` (the schema type name) and `_key`, matching how Portable Text blocks are shaped.
- **Portable Text (`richTableBlock`):** the block wrapper supplies the root `_type` / `_key` behaviour for the table object in the block array.

## Top-level object: `richTable`

- Type: `object`
- Purpose: container for the table data and UI flags.
- Fields:
  - `rows` (array, required, min 1): array of `row` items (underlying type `richTableRow` object). Validation enforces at least one row.
  - `columnHeaders` (array, optional): array of `columnHeader` objects.
  - `hasColumnTitles` (boolean): UI flag, initial value `true`.
  - `hasRowTitles` (boolean): UI flag, initial value `true`.
- Components: custom `input` and `block` components are wired so the editor renders a table-specific UI.

## Row object: `richTableRow`

- Type: `object`
- Purpose: represents a single table row.
- Fields:
  - `title` (string, optional): a label/title for the row.
  - `cells` (array, optional): array of `richTableCell` objects.
- Preview: shows the row title (or "Row") and a subtitle reporting the number of cells.

## Cell object: `richTableCell`

- Type: `object`
- Purpose: content-holder for a single table cell.
- Fields:
  - `content` (array): uses the `content` array schema (portable text `block` entries by default).
- The `content` array enables rich/portable-text content inside cells.

## Cell Portable Text: `content`

- Type: `array` of portable text `block` members.
- Options: editor options configured for cell usage.
- Additional block or inline types (images, custom annotations) will be added later.

## Column header object: `columnHeader`

- Type: `object`
- Purpose: describes a column header that can be associated with column indexes.
- Fields:
  - `title` (string, optional): header label.
  - `cellIndex` (number, required): the index of the column this header corresponds to.
- `cellIndex` and index of the header item should align and are updated with every move. Be aware that both need to be checked when rendering the table to make sure all things align.

## TypeScript interfaces (conceptual)

- `RichTableType`
  - `rows?: Array<RichTableRowType>`(required min.1)
  - `columnHeaders?: Array<ColumnHeader & ObjectItem>`
  - `hasColumnTitles?: boolean`
  - `hasRowTitles?: boolean`

- `RichTableRowType`
  - `title?: string`
  - `cells?: Array<RichTableCellType>`

- `RichTableCellType`
  - `content: Array<PortableTextBlock>`

- `ColumnHeader`
  - `title?: string`
  - `cellIndex: number` (required)

(These interfaces mirror the shape of the stored documents and help TypeScript consumers.)

## Constraints & Notes

- `rows` is required and must contain at least one row; individual rows may have differing `cells` lengths — the schema does not enforce a uniform column count.
- `columnHeaders` map to column positions using `cellIndex`. Consumers should handle missing headers or mismatched counts gracefully.
- `content` for each cell uses the portable text block schema; renderers should expect an array of portable text blocks.
- Custom input and block components are registered on the `richTable` type to provide a table-specific editor and block rendering.

## JSON example

If you use the rich table as a field, the stored data might look like this (removed `_key` and most portable text fields for brevity):

```json
{
  "rows": [
    {
      "title": "Row 1",
      "cells": [
        {"content": [{"_type": "block", "children": [{"_type": "span", "text": "Cell 1-1"}]}]},
        {"content": [{"_type": "block", "children": [{"_type": "span", "text": "Cell 1-2"}]}]}
      ]
    },
    {
      "title": "Row 2",
      "cells": [
        {"content": [{"_type": "block", "children": [{"_type": "span", "text": "Cell 2-1"}]}]},
        {"content": [{"_type": "block", "children": [{"_type": "span", "text": "Cell 2-2"}]}]}
      ]
    }
  ],
  "columnHeaders": [
    {"title": "First", "cellIndex": 0},
    {"title": "Second", "cellIndex": 1}
  ],
  "hasColumnTitles": true,
  "hasRowTitles": true
}
```
