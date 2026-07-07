import {defineType, ObjectInputProps} from 'sanity'

import RichTableBock from '../components/RichTableBock'
import RichTableInput from '../components/RichTableInput'
import type {RichTableType} from '../schemas/richTable.object'

/**
 * The `richTableBlock` Portable Text member (a `richTable` used inside a document
 * body). This is a **factory** — like {@link defineRichTableObject} — so the
 * block's input can thread `portableTextSchemaTypeName` down to the cell editor.
 *
 * It was previously a static type whose input dropped the option, so a table
 * authored as `type: 'richTableBlock'` always fell back to the default cell
 * schema (its cells' `ContentPortableTextEditor` received
 * `portableTextSchemaTypeName === undefined` → `schema.get(undefined)` →
 * default marks), regardless of the plugin config — while the `richTable`
 * object/field/array paths, which do thread it, worked. Threading it here makes
 * every insertion path honour the custom cell schema.
 */
export const defineRichTableBlock = ({
  portableTextSchemaTypeName,
}: {
  portableTextSchemaTypeName?: string
}) => {
  return defineType({
    name: 'richTableBlock',
    title: 'Rich Table Block',
    type: 'richTable',
    components: {
      block: RichTableBock,
      input: (inputProps) => (
        // The block's input receives a generic ObjectInputProps; narrow the value
        // to the rich-table shape RichTableInput expects (this member is a
        // `richTable`), and forward the configured cell content schema.
        <RichTableInput
          {...(inputProps as ObjectInputProps<RichTableType>)}
          isInPortableText
          portableTextSchemaTypeName={portableTextSchemaTypeName}
        />
      ),
    },
  })
}
