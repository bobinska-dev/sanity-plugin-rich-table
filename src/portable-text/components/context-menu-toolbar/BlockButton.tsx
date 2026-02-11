import {ComponentType} from 'react'
import {Box, Button, Text, Tooltip} from '@sanity/ui'
import {ToolbarBlockObjectSchemaType, useBlockObjectButton} from '@portabletext/toolbar'
import {useDocumentPane} from 'sanity/structure'

// TODO: CHRISTIAN HALP
// TODO: Make onPathOpen work like it does in the Studio form -> might work without custom dialog then
const BlockButton: ComponentType<{blockObject: ToolbarBlockObjectSchemaType}> = ({blockObject}) => {
  const {send} = useBlockObjectButton({schemaType: blockObject})
  // console.log(blockObject)
  const {onPathOpen} = useDocumentPane()

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
          onClick={
            (e) => {
              console.log(e, blockObject)
              send({
                type: 'insert',
                value: blockObject.defaultValues || { _type: blockObject.name },
                placement: 'auto',
              })
              // onPathOpen([])
            }
            /*() =>
            send({
              type: 'insert',
              value: blockObject.defaultValues || {},
              placement: 'auto',
            })*/
          }
          icon={blockObject.icon}
          as={'button'}
          padding={2}
          tone={'default'}
          mode={'bleed'}
          title={blockObject.shortcut?.keys.join('+')}
        />
      </Tooltip>
{/*      {snapshot.matches({enabled: 'showing dialog'}) === true && (
        <ObjectFormDialog
          open={true}
          onClose={() => send({type: 'close dialog'})}
          blockObject={blockObject}
          send={send}
        />
      )}*/}
    </>
  )
}
export default BlockButton
