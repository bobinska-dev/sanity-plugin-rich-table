# Rich table plugin documentation

## Table of contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Usage in Sanity Studio](#usage-in-sanity-studio)
4. [Data Structure](#data-structure)
5. [Debugging data issues](#debugging-data-issues)
6. [Reviewing changes](#reviewing-changes)
7. [Render tables](#render-tables)
8. [Merging cells](#merging-cells)

## Overview

This documentation provides an overview of the rich table plugin for Sanity Studio, including installation instructions, usage guidelines, and details on the data structure and rendering of tables.

## Installation

To install the rich table plugin, run the following command in your Sanity Studio project directory:

```sh
npm install sanity-plugin-rich-table
```

## Usage in Sanity Studio

Add it as a plugin in `sanity.config.ts` (or .js):

```ts
import {defineConfig} from 'sanity'
import {richTablePlugin} from 'sanity-plugin-rich-table'

export default defineConfig({
  //...
  plugins: [richTablePlugin({})],
})
```

After installing the plugin, you can use the `richTable` object type in your schemas as a field (object) or the `richTableBlock` type in your Portable Text fields.

### Usage as a field

```ts
defineField({
  name: 'myRichTable',
  title: 'My Rich Table',
  type: 'richTable', // Use the rich table object type
})
```

### Usage as a custom block in Portable Text

To use the rich table as a block in the Portable Text (block content) editor, you only need to add in the schema's `of`:

```ts
// schemas/<your-portable-text-schema-name>.ts
defineArrayMember({
  name: 'richTableBlock',
  title: 'Rich Table Block',
  type: 'richTableBlock', // Use the rich table block type
})
```

## Data Structure

The underlying data structure of the rich table is not an array directly, instead it's an object with a `rows` and a `columnHeaders` array as well as UI flags for hidding column and row titles.

Using an object instead of a simple array allows us to store column meta data separately and manage UI flags more easily. And it also circumvents the limitations that arrays cannot be nested directly in arrays in Sanity.

The main object shape is as follows:

```ts
interface RichTableType {
  rows: Array<RichTableRowType> // required, min.1
  columnHeaders?: Array<ColumnHeader & ObjectItem>
  hasColumnTitles?: boolean
  hasRowTitles?: boolean
}
interface RichTableRowType {
  title?: string
  cells?: Array<RichTableCellType>
}
interface RichTableCellType {
  content: Array<PortableTextBlock>
}
interface ColumnHeader {
  title?: string
  cellIndex: number // required
}
```

**Read more about the data structure in [data-structure.md](./data-structure.md)**

### Debugging data issues

Each instance of the rich table input has a debug button in the bottom-left corner. Clicking it will open the default underlying fields of the object, so you can inspect and edit the data in the form you are used to.

**_DO NOT REMOVE CELLS WITH EMPTY CONTENT FROM THE ARRAYS MANUALLY!_**

When cells are created each cell will automatically receive a `content` array with one child. This child (type `PortableTextTextBlock`) has an empty `text` node. Unfortunately this is needed for the UI to play nice.

## Reviewing changes

Rich tables render a custom diff in the Studio's **Review changes** pane (used by document history and content releases), because the generic field-by-field differ struggles with the deeply nested rows → cells → Portable Text structure.

What you get:

- **A diff grid** summarising which rows and columns were added, removed or moved, and which cells changed. Column/row title edits and title-visibility toggles are shown too.
- **A combined cell view.** Click a changed cell to open a detail dialog with a single **Changes** section: removed text is struck through, added text is highlighted, and unchanged text is left plain — instead of separate "Before" and "After" blocks. Each revision's raw Portable Text is still available under _Raw content_.
- **Inline changes in the editor.** When Studio's inline-changes mode is enabled (the toggle that adds `?displayInlineChanges=true` to the URL), the same before→after highlights are overlaid directly on each cell's editor while it stays fully editable. This reads the compared revision from the Structure tool's document pane, so it applies when you are reviewing a revision there.

The diff compares the plain text of each cell (marks and annotations are ignored), so formatting-only changes may not be highlighted — open the cell dialog's _Raw content_ to inspect those. Nothing here needs configuration; the diff is wired up automatically for the `richTable` type.

## Render tables

To render the rich table data in your frontend application, you can use some of the following example React components.
Other frameworks as well as libraries (like Tanstack Table) will be able to use a similar approach since your table data is not pesky like Mardown or locked in HTML strings or iFrames.

### Using a simple HTML table in React

```tsx
import React from 'react'
import {RichTableType} from 'sanity-plugin-rich-table'
import {PortableText} from '@portabletext/react'

interface RichTableProps {
  tableData: RichTableType
}

export const RichTable: React.FC<RichTableProps> = ({tableData}) => {
  const {rows, columnHeaders, hasColumnTitles, hasRowTitles} = tableData

  return (
    <table>
      <thead>
        {hasColumnTitles && (
          <tr>
            {hasRowTitles && <th></th>}
            {columnHeaders?.map((header, index) => (
              <th key={index}>{header.title}</th>
            ))}
          </tr>
        )}
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {hasRowTitles && <th>{row.title}</th>}
            {row.cells?.map((cell, cellIndex) => (
              <td key={cellIndex}>
                <PortableText value={cell.content} components={/* your components */} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

### Using styled components for a grid layout

The grid layout can be a flexible alternative to traditional tables:

```tsx
import React from 'react'
import styled from 'styled-components'
import {RichTableType} from 'sanity-plugin-rich-table'
import {PortableText} from '@portabletext/react'
interface RichTableProps {
  tableData: RichTableType
}
const TableGrid = styled.div<{$columns: number}>`
  display: grid;
  grid-template-columns: repeat(${(props) => props.$columns}, 1fr);
  gap: 16px;
`

export const RichTableGrid: React.FC<RichTableProps> = ({tableData}) => {
  const {rows, columnHeaders, hasColumnTitles, hasRowTitles} = tableData
  const totalColumns = (hasRowTitles ? 1 : 0) + (columnHeaders?.length || 0)

  return (
    <TableGrid $columns={totalColumns}>
      {/* Placeholder for first cell in header row, so that column titles and row titles dont akwardly sit on top of each other */}
      {hasRowTitles && <div />}
      {hasColumnTitles &&
        columnHeaders?.map((header, index) => (
          <div key={header._key} style={{fontWeight: 'bold'}}>
            {header.title}
          </div>
        ))}
      {rows.map((row, rowIndex) => (
        <React.Fragment key={row._key}>
          {hasRowTitles && <div style={{fontWeight: 'bold'}}>{row.title}</div>}
          {row.cells?.map((cell, cellIndex) => (
            <div key={cell._key}>
              <PortableText value={cell.content} components={/* your components */} />
            </div>
          ))}
        </React.Fragment>
      ))}
    </TableGrid>
  )
}
```

Easy peasy!

## Merging cells

If you leave some cells empty, you can achieve a simple cell merging effect in your table renderings by using CSS. For example, you can use the `grid-column` property in a CSS grid layout or the `colspan` attribute in an HTML table to span multiple columns.

you can check if a cell is empty by checking if the `content` array is empty for the first item in the `chilren` array and specifically the `text`. unfortunately, there is no built-in way to merge cells in the Sanity Studio editor itself at the moment.

```tsx
// first check which cells are empty and then add a flag to the previous / next cell to span accordingly
const mergedTableData = tableData.rows.map((row) => {
  const newCells = []
  let skipNext = 0

  for (let i = 0; i < row.cells.length; i++) {
    if (skipNext > 0) {
      skipNext--
      continue
    }

    const cell = row.cells[i]
    let colSpan = 1

    // Check for empty cells to the right
    for (let j = i + 1; j < row.cells.length; j++) {
      const nextCell = row.cells[j]
      if (isCellEmpty(nextCell)) {
        colSpan++
      } else {
        break
      }
    }

    newCells.push({...cell, colSpan})
    skipNext = colSpan - 1
  }

  return {...row, cells: newCells}
})
function isCellEmpty(cell) {
  return (
    !cell.content ||
    cell.content.length === 0 ||
    (cell.content[0]._type === 'block' &&
      cell.content[0].children.every((child) => child._type === 'span' && child.text.trim() === ''))
  )
}
// Then use the colSpan property in your rendering logic
;<TableGrid $columns={totalColumns}>
  {/* ... header row etc. */}
  {mergedTableData.rows.map((row, rowIndex) => (
    <React.Fragment key={row._key}>
      {hasRowTitles && <div style={{fontWeight: 'bold'}}>{row.title}</div>}
      {row.cells?.map((cell, cellIndex) => (
        <div key={cell._key} style={{gridColumn: `span ${cell.colSpan || 1}`}}>
          <PortableText value={cell.content} components={/* your components */} />
        </div>
      ))}
    </React.Fragment>
  ))}
</TableGrid>
```

With a bit of logic and CSS, you can create merged cells in your rich table renderings! 🥳
