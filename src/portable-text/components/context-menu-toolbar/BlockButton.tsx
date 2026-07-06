import {ToolbarBlockObjectSchemaType, useBlockObjectButton} from '@portabletext/toolbar'
import {Box, Button, Text, Tooltip} from '@sanity/ui'
import {ComponentType} from 'react'

const BlockButton: ComponentType<{
  blockObject: ToolbarBlockObjectSchemaType
}> = ({blockObject}) => {
  const {send, snapshot} = useBlockObjectButton({schemaType: blockObject})

  // Icon is restored onto the toolbar block object by `extendBlockObject`
  // (PTE strips icons from its own toolbar schema — see createExtendBlockObject).
  const icon = blockObject.icon || <span>{blockObject.name.substring(0, 2).toUpperCase()}</span>
  return (
    <>
      <Tooltip
        content={
          <Box padding={2}>
            <Text size={1}>{blockObject.title}</Text>
          </Box>
        }
      >
        <Button
          key={blockObject.name}
          onClick={() => {
            // The toolbar's block-object machine only handles `insert` in its
            // `showing dialog` state, so open the dialog first, then insert.
            // The inserted block can then be edited via the BlockPopover (onPathOpen).
            send({type: 'open dialog'})
            send({
              type: 'insert',
              value: blockObject.defaultValues ?? {},
              placement: 'auto',
            })
          }}
          icon={icon}
          disabled={snapshot.matches('disabled')}
          as={'button'}
          padding={2}
          tone={'default'}
          mode={'bleed'}
          aria-label={blockObject.title ?? blockObject.name}
          title={blockObject.shortcut?.keys.join('+')}
        />
      </Tooltip>
    </>
  )
}
export default BlockButton
