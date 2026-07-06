import {ToolbarInlineObjectSchemaType, useInlineObjectButton} from '@portabletext/toolbar'
import {Box, Button, Text, Tooltip} from '@sanity/ui'
import {ComponentType} from 'react'

/** Toolbar button that inserts an inline object at the caret (mirrors {@link BlockButton}). */
const InlineObjectButton: ComponentType<{
  inlineObject: ToolbarInlineObjectSchemaType
}> = ({inlineObject}) => {
  const {send, snapshot} = useInlineObjectButton({schemaType: inlineObject})

  const icon = inlineObject.icon || <span>{inlineObject.name.substring(0, 2).toUpperCase()}</span>
  return (
    <Tooltip
      content={
        <Box padding={2}>
          <Text size={1}>{inlineObject.title}</Text>
        </Box>
      }
    >
      <Button
        key={inlineObject.name}
        onClick={() => {
          // Same two-step as block objects: the machine only accepts `insert` in
          // its `showing dialog` state. The inserted object can then be edited via
          // the InlineObjectPopover.
          send({type: 'open dialog'})
          send({type: 'insert', value: inlineObject.defaultValues ?? {}})
        }}
        icon={icon}
        disabled={snapshot.matches('disabled')}
        as={'button'}
        padding={2}
        tone={'default'}
        mode={'bleed'}
        aria-label={inlineObject.title}
        title={inlineObject.shortcut?.keys.join('+')}
      />
    </Tooltip>
  )
}
export default InlineObjectButton
