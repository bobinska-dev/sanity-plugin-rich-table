import {Box, Dialog, Flex, Text} from '@sanity/ui'
import {ComponentType} from 'react'
import {ObjectInputProps, OperationsAPI, pathToString} from 'sanity'

import {RichTableType} from '../schemas/richTable.object'
import TableWrapper from './TableWrapper'

const ExpandedTableDialog: ComponentType<
  ObjectInputProps<RichTableType> & {
    handleClose?: () => void
    isInDialog?: boolean
    /** Patch function from Sanity document operations for optimistic changes */
    patch: OperationsAPI['patch']
  }
> = ({patch, value, onChange, ...props}) => {
  const pathString = pathToString(props.path)
  const dialogId = `expanded-table-dialog-${pathString}`
  const descriptionId = `${dialogId}-description`
  return (
    <Dialog
      id={dialogId}
      width={4}
      header="Expanded table editor"
      onClose={props.handleClose}
      aria-describedby={descriptionId}
      aria-modal
      role="dialog"
    >
      {/* Hidden description referenced by aria-describedby for screen readers */}
      <Box
        id={descriptionId}
        style={{
          position: 'absolute',
          left: -9999,
          top: 'auto',
          width: 1,
          height: 1,
          overflow: 'hidden',
        }}
      >
        <Text size={1}>
          Edit table contents in an expanded view. Use the table controls to add, remove or reorder
          columns and rows.
        </Text>
      </Box>
      <Flex padding={3} justify={'center'}>
        <TableWrapper {...props} isInDialog patch={patch} value={value} onChange={onChange} />
      </Flex>
    </Dialog>
  )
}
export default ExpandedTableDialog
