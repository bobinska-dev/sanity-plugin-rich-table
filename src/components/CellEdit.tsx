import {ComponentType} from 'react'
import {
  FieldMember,
  FormCallbacksProvider,
  MemberField,
  ObjectInputProps,
  OperationsAPI,
  PortableTextInput,
  PortableTextInputProps,
  pathToString,
  useFormCallbacks,
} from 'sanity'

export interface CellEditProps {
  member: FieldMember
  cellBasePath: any[]
  patch: OperationsAPI['patch']
  renderInput: ObjectInputProps['renderInput']
  renderField: ObjectInputProps['renderField']
  renderItem: ObjectInputProps['renderItem']
  renderPreview: ObjectInputProps['renderPreview']
  renderBlock: ObjectInputProps['renderBlock']
  renderInlineBlock: ObjectInputProps['renderInlineBlock']
  renderAnnotation: ObjectInputProps['renderAnnotation']
}

/**
 * Editable cell component.
 * Wraps MemberField with FormCallbacksProvider for path rewriting so edits
 * are applied to the correct location in the document.
 */
const CellEdit: ComponentType<CellEditProps> = ({
  member,
  cellBasePath,
  patch,
  renderInput,
  renderField,
  renderItem,
  renderPreview,
  renderBlock,
  renderInlineBlock,
  renderAnnotation,
}) => {
  const parentCallbacks = useFormCallbacks()

  // Only override onChange to rewrite paths
  const patchedCallbacks = {
    ...parentCallbacks,
    onChange: (event: any) => {
      if (!event?.patches) {
        parentCallbacks.onChange?.(event)
        return
      }
      const rewrittenPatches = event.patches.map((p: any) => {
        const fullPath = [...cellBasePath, ...(p.path ?? [])]
        const pathStr = pathToString(fullPath)
        if (p.type === 'set') return {set: {[pathStr]: p.value}}
        if (p.type === 'setIfMissing') return {setIfMissing: {[pathStr]: p.value}}
        if (p.type === 'unset') return {unset: [pathStr]}
        if (p.type === 'insert') return {insert: {[p.position]: pathStr, items: p.items}}
        if (p.type === 'diffMatchPatch') return {diffMatchPatch: {[pathStr]: p.value}}
        return p
      })
      patch.execute(rewrittenPatches)
    },
  }

  return (
    <FormCallbacksProvider {...patchedCallbacks}>
      <MemberField
        member={member}
        renderInput={(inputProps: PortableTextInputProps) => {
          const schemaType = inputProps.schemaType as any
          const isPTE =
            schemaType?.jsonType === 'array' && schemaType?.of?.some((m: any) => m.name === 'block')
          if (!isPTE) {
            return renderInput(inputProps)
          }
          return <PortableTextInput {...inputProps} />
        }}
        renderField={(fieldProps) => {
          // Only hide the label for the top-level 'content' field, keep labels for nested fields
          if (fieldProps.name === 'content') {
            return fieldProps.children
          }
          return renderField(fieldProps)
        }}
        renderItem={renderItem}
        renderPreview={renderPreview}
        renderBlock={renderBlock}
        renderInlineBlock={renderInlineBlock}
        renderAnnotation={renderAnnotation}
      />
    </FormCallbacksProvider>
  )
}

export default CellEdit
