import {
  BlockObjectButtonEvent,
  ToolbarBlockObjectSchemaType,
  useBlockObjectButton,
} from '@portabletext/toolbar'
import {Dialog} from '@sanity/ui'
import {ComponentType} from 'react'

// TODO: Implement the form fields based on blockObject schema
const ObjectFormDialog: ComponentType<{
  open: boolean
  onClose: () => void
  blockObject: ToolbarBlockObjectSchemaType
  send: (event: BlockObjectButtonEvent) => void
}> = ({blockObject}) => {
  const {snapshot, send} = useBlockObjectButton({schemaType: blockObject})
  return (
    <Dialog
      id={'object-form-dialog'}
      open={snapshot.matches({enabled: 'showing dialog'})}
      onClose={() => send({type: 'close dialog'})}
      header={`Edit ${blockObject.title}`}
      zOffset={100}
    >
      hello
    </Dialog>
  )
}
export default ObjectFormDialog
