import {AnnotationPath, PortableTextObject} from '@portabletext/editor'
import {ToolbarAnnotationSchemaType} from '@portabletext/toolbar'
import {Button, Card, Dialog, Flex, Stack, Switch, Text, TextInput} from '@sanity/ui'
import {ComponentType, useState} from 'react'

/** Dialog component for editing an annotation's properties.
 *
 * @param annotation - `annotation`: {@link PortableTextObject} The annotation value to edit.
 * @param onSubmit - `onSubmit: {(value: { [key: string]: unknown }) => void}` Callback when the user submits the dialog with the updated annotation value.
 * @param onClose - `onClose: {() => void}` Callback when the user closes the dialog without submitting.
 *
 * ## Usage
 * ```tsx
 * <AnnotationDialog
 *  annotation={annotation}
 *  onSubmit={({value}) => handleAnnotationSubmit(value)}
 *  onClose={() => handleClose()}
 *  />
 *  ```
 *
 * # Will be removed in the future - instead the rich table will open the default modals via useDocumentPane
 */
const AnnotationDialog: ComponentType<{
  annotation: {
    value: PortableTextObject
    schemaType: ToolbarAnnotationSchemaType
    at: AnnotationPath
  }
  onSubmit: ({value}: {value: {[key: string]: unknown}}) => void
  onClose: () => void
}> = (props) => {
  const [value, setValue] = useState(
    props.annotation.value || props.annotation.schemaType.defaultValues,
  )
  return (
    <Dialog
      id={'edit-annotation-dialog'}
      header={`Edit ${props.annotation.schemaType.title}`}
      onClose={props.onClose}
    >
      <Stack padding={4} space={4}>
        {props.annotation.schemaType.fields?.map((field, index) => {
          if (field.type === 'string') {
            return (
              <Stack space={3} key={field.name}>
                <Text as={'label'} size={0} htmlFor={field.name}>
                  {field.title}
                </Text>
                <TextInput
                  autoFocus={index === 0}
                  value={value[field.name] as string}
                  onChange={(e) => setValue({...value, [field.name]: e.currentTarget.value})}
                  id={field.name}
                  // TODO: add validation based on field definition
                />
              </Stack>
            )
          }
          if (field.type === 'boolean') {
            return (
              <Flex align={'center'} gap={3} key={field.name}>
                <Switch
                  id={field.name}
                  checked={!!value[field.name]}
                  onChange={(e) => setValue({...value, [field.name]: e.currentTarget.checked})}
                />
                <Text as={'label'} size={1} htmlFor={field.name}>
                  {field.title}
                </Text>
              </Flex>
            )
          }
          return (
            <Card tone={'caution'} key={field.name}>
              Input for {field.title} coming soon!
            </Card>
          )
        })}
        <Flex justify={'flex-end'} align={'center'} padding={3}>
          <Button mode={'ghost'} onClick={() => props.onSubmit({value})} text={'Done!'} />
        </Flex>
      </Stack>
    </Dialog>
  )
}
export default AnnotationDialog
