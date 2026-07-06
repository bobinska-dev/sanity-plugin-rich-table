import {ComponentType} from 'react'
import {ObjectFieldProps} from 'sanity'

import {useTableCellValidation} from '../hooks/useTableCellValidation'

/**
 * Injects the table's aggregated descendant validation markers (cells,
 * annotations, the "min 1 row" rule, …) into the native field header, so the
 * field-title validation indicator matches every other field.
 *
 * The custom table input renders its own body and hides `renderDefault`, so deep
 * markers never bubble to the field level on their own. `useDocumentPane().
 * validation` is the flat document-wide list; we hand the subset under this
 * field to `renderDefault`, letting Sanity draw its standard marker (identical
 * icon, position and tooltip to a plain field).
 */
const RichTableField: ComponentType<ObjectFieldProps> = (props) => {
  const getValidation = useTableCellValidation()
  const {markers} = getValidation(props.path)
  return props.renderDefault({
    ...props,
    validation: markers as unknown as ObjectFieldProps['validation'],
  })
}

export default RichTableField
