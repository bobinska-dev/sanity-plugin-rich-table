// RichCellPortableTextInput.tsx
import {ComponentType} from 'react'
import {PortableTextInput, PortableTextInputProps} from 'sanity'
import {defaultSchemaDefinition} from '../portable-text/resolveSchemaDefinition'
import {getAdditionalBlockObjects} from '../pluginConfig'

type Props = PortableTextInputProps

const RichCellPortableTextInput: ComponentType<Props> = (props) => {
  const {value, path, readOnly, onChange, ...rest} = props

  // Build schema definition with extra block objects
  const additionalBlockObjects = getAdditionalBlockObjects()
  const schemaDefinition = {
    ...defaultSchemaDefinition,
    ...(additionalBlockObjects.length ? {blockObjects: additionalBlockObjects} : {}),
  }

  // Forward everything; ContentPortableTextInput will use the core props,
  // and ignore anything it doesn’t care about.
  return (
    <PortableTextInput
      value={value as any}
      path={path}
      readOnly={readOnly}
      onChange={onChange}
      // @ts-ignore allow extra props to pass through if you extend the input later
      schemaDefinition={schemaDefinition}
      {...rest}
    />
  )
}

export default RichCellPortableTextInput
