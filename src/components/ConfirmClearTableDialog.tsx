import {Box, Button, Dialog, Flex, Stack, Text} from '@sanity/ui'
import {ComponentType, useCallback, useState} from 'react'
import {OperationsAPI} from 'sanity'

interface ConfirmClearTableDialogProps {
  /** Patch function from Sanity document operations for optimistic changes */
  patch: OperationsAPI['patch']
  path: string
  onClose: () => void
  open: boolean
  readOnly?: boolean
}
const ConfirmClearTableDialog: ComponentType<ConfirmClearTableDialogProps> = ({
  patch,
  path,
  onClose,
  open,
  readOnly,
}) => {
  const [isProcessing, setIsProcessing] = useState(false)

  const dialogId = `confirm-clear-table-dialog-${path}`
  const descriptionId = `${dialogId}-description`

  const handleConfirm = useCallback(() => {
    setIsProcessing(true)
    try {
      patch.execute([{unset: [path]}])
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }, [patch, path, onClose])

  return (
    <Dialog
      id={dialogId}
      header="Clear table value completely"
      width={1}
      onClose={onClose}
      open={open}
      aria-describedby={descriptionId}
      aria-modal
      role="alertdialog"
      aria-busy={isProcessing}
    >
      <Stack space={4} padding={4} id={descriptionId}>
        <Box>
          <Text size={1} weight={'semibold'}>
            Are you sure you want to clear the entire table?
          </Text>
        </Box>
        <Box>
          <Text muted size={1}>
            You will be able to re-initialise the table afterwards, but all current data will be
            lost. If you want to undo this, you will need to use the Review Changes panel in the
            History inspector to revert the changes (potentially one by one).
          </Text>
        </Box>
        <Flex justify={'flex-end'} gap={3}>
          <Button
            text={'Cancel'}
            mode={'ghost'}
            onClick={onClose}
            tone={'critical'}
            aria-label={'Cancel clear table'}
            disabled={isProcessing || readOnly}
          />
          <Button
            text={'Confirm'}
            mode={'ghost'}
            onClick={handleConfirm}
            tone={'positive'}
            aria-label={'Confirm clear table'}
            disabled={isProcessing || readOnly}
          />
        </Flex>
      </Stack>
    </Dialog>
  )
}
export default ConfirmClearTableDialog
