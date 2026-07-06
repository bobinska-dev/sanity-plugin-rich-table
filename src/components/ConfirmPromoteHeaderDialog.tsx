import {Box, Button, Dialog, Flex, Stack, Text} from '@sanity/ui'
import {ComponentType, useCallback, useState} from 'react'

/** Which set of titles we're promoting a row/column into. */
export type PromoteHeaderMode = 'rowToColumnTitles' | 'columnToRowTitles'

interface ConfirmPromoteHeaderDialogProps {
  mode: PromoteHeaderMode
  open: boolean
  onClose: () => void
  /** Runs the promote patches. Called once the editor confirms. */
  onConfirm: () => void
  readOnly?: boolean
  /** Disambiguates the dialog id when several tables share a page. */
  path: string
}

const COPY: Record<PromoteHeaderMode, {header: string; question: string; confirmLabel: string}> = {
  rowToColumnTitles: {
    header: 'Use row as column titles',
    question:
      "The first row's cells will be moved into the column titles and the row will be removed.",
    confirmLabel: 'Confirm: use row as column titles',
  },
  columnToRowTitles: {
    header: 'Use column as row titles',
    question:
      "The first column's cells will be moved into the row titles and the column will be removed.",
    confirmLabel: 'Confirm: use column as row titles',
  },
}

/**
 * Confirmation before promoting the first row/column into titles.
 *
 * The action is lossy (rich text is flattened to plain text) and removes a
 * row/column, so — like {@link ./ConfirmClearTableDialog} — we ask first.
 */
const ConfirmPromoteHeaderDialog: ComponentType<ConfirmPromoteHeaderDialogProps> = ({
  mode,
  open,
  onClose,
  onConfirm,
  readOnly,
  path,
}) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const copy = COPY[mode]
  const dialogId = `confirm-promote-header-dialog-${mode}-${path}`
  const descriptionId = `${dialogId}-description`

  const handleConfirm = useCallback(() => {
    setIsProcessing(true)
    try {
      onConfirm()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }, [onConfirm, onClose])

  if (!open) return null

  return (
    <Dialog
      id={dialogId}
      header={copy.header}
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
            {copy.question}
          </Text>
        </Box>
        <Box>
          <Text muted size={1}>
            Any rich text formatting in those cells is flattened to plain text. You can revert this
            from the Review Changes panel in the History inspector.
          </Text>
        </Box>
        <Flex justify={'flex-end'} gap={3}>
          <Button
            text={'Cancel'}
            mode={'ghost'}
            onClick={onClose}
            tone={'default'}
            autoFocus
            disabled={isProcessing || readOnly}
          />
          <Button
            text={'Confirm'}
            mode={'ghost'}
            onClick={handleConfirm}
            tone={'critical'}
            aria-label={copy.confirmLabel}
            disabled={isProcessing || readOnly}
          />
        </Flex>
      </Stack>
    </Dialog>
  )
}
export default ConfirmPromoteHeaderDialog
