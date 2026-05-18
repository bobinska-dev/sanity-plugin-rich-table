# Custom Cell Content Schema Support

## Summary

This PR extends the rich table plugin to support native Sanity block types in table cells. Previously, rich text in table cells was limited to annotations and decorators only. Now users can define their own `cellContentSchema` in the plugin configuration using standard Sanity type definitions, enabling full block editing with images, custom objects, and any other block type—just like any other Portable Text field in Sanity.

## Key Features

### 🎯 Custom Cell Content Schema

- Define custom `cellContentSchema` in plugin configuration using standard Sanity type definitions
- Add images, custom objects, or any block type to table cells
- Edit cells exactly as you would any other Portable Text field in Sanity

```ts
richTablePlugin({
  cellContentSchema: {
    type: 'array',
    of: [
      defineArrayMember({type: 'block'}),
      defineArrayMember({
        type: 'image',
        name: 'image',
        options: {hotspot: true},
      }),
    ],
  },
})
```

### 🎯 Native Sanity Block Type Editing

- Full support for native Sanity block types in table cells (images, icon pickers, link objects, etc.)
- Proper path rewriting ensures patches are applied to the correct document location
- Uses `FormCallbacksProvider` to intercept and rewrite patch paths during edit mode

### ⌨️ Cell Navigation & Selection

- **Arrow keys**: Navigate between cells
- **Tab**: Move to next cell (wraps to next row)
- **Enter**: Start editing selected cell
- **Escape**: Close edit mode or deselect
- **Double-click**: Enter edit mode directly
- Visual selection state with cell outline

### 🔄 Preview/Edit Mode Split

- **Preview mode**: Clean, read-only view with hidden toolbar and scrollbars
- **Edit mode**: Full Sanity editing experience with `PortableTextInput`
- Edit button appears on selected cells for easy access
- Cells maintain consistent sizing when switching between modes

### ♿ Accessibility

- ARIA attributes for cell labels (`aria-label="Cell A1"`)
- Selection state (`aria-selected`)
- Keyboard-navigable with proper tab indices
- Screen reader friendly cell labels (A1, B2, etc.)

## Technical Changes

### New Files

- `src/components/PortableTextCell.tsx` - Unified cell component handling preview/edit states
- `src/hooks/useCellNavigation.tsx` - Cell selection and keyboard navigation hook
- `src/utils/cellUtils.ts` - Utility functions for cell member/path lookup
- `src/__tests__/components/PortableTextCell.test.tsx` - 24 unit tests
- `src/__tests__/hooks/useCellNavigation.test.ts` - 28 unit tests

### Modified Files

- `src/components/Table.tsx` - Integrated cell navigation and new PortableTextCell
- `src/components/TableGrid.tsx` - Narrower row headers (0.5fr)
- `src/components/RichTableInput.tsx` - Simplified cell rendering
- `src/schemas/cell.object.tsx` - Customizable cell content schema
- `src/hooks/useAddColumn.tsx` - Fixed missing `_key` on new cell blocks
- `eslint.config.mjs` - Added test file rule overrides

## Architecture

```
Table.tsx
├── useCellNavigation() - manages selection/editing state
├── PortableTextCell
│   ├── Preview mode: MemberField with readOnly=true
│   └── Edit mode: FormCallbacksProvider + MemberField
│       └── onChange rewrites patch paths with cellBasePath prefix
└── patch.execute() - applies rewritten patches to document
```

## Misc

- **Cell sizing**: Cells maintain `align-self: start` to prevent height matching tallest cell
- **Row headers**: Narrower width (0.5fr) for better table proportions

## Test Coverage

- 253 total tests (all passing)
- 52 new tests for cell navigation and PortableTextCell components
- Full coverage of keyboard navigation, edit mode, and accessibility

## Breaking Changes

None - backwards compatible with existing table content.

## Screenshots

_Add screenshots of the editing experience here_
