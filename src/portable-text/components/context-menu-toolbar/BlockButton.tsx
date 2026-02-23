import {ToolbarBlockObjectSchemaType, useBlockObjectButton} from '@portabletext/toolbar'
import {Box, Button, Text, Tooltip} from '@sanity/ui'
import {ComponentType} from 'react'
import {useDocumentPane} from 'sanity/structure'

// TODO: CHRISTIAN HALP
// What does not work: send({type: 'insert', value: blockObject.defaultValues || {_type: blockObject.name}, placement: 'auto'}) does not do anything -> we need to have an actual block -> and its path to open the Dialog for the block using useDocumentPane.onPathOpen

const BlockButton: ComponentType<{
  blockObject: ToolbarBlockObjectSchemaType
  customBlockSchemaType?: any
}> = ({blockObject, customBlockSchemaType}) => {
  const {send} = useBlockObjectButton({schemaType: blockObject})

  const {onPathOpen} = useDocumentPane()
  console.log(blockObject, customBlockSchemaType)

  const icon = customBlockSchemaType?.icon || blockObject.icon || (
    <span>{blockObject.name.substring(0, 2).toUpperCase()}</span>
  )
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
                value: blockObject.defaultValues || {_type: blockObject.name},
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
          icon={icon}
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
