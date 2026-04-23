import {ArrowLeftIcon, ArrowRightIcon, CloseIcon} from '@sanity/icons'
import {Box, Button, Card, Dialog, Flex, Text} from '@sanity/ui'
import {ComponentType, useCallback, useEffect, useRef, useState} from 'react'
import {FieldMember, MemberField, ObjectInputProps, OperationsAPI, pathToString} from 'sanity'
import {useFormCallbacks, FormCallbacksProvider} from 'sanity'

interface CellPosition {
  rowIndex: number
  cellIndex: number
  cellKey: string
}

interface CellEditDialogProps {
  position: CellPosition
  totalRows: number
  totalCols: number
  getCellMember: (rowIndex: number, cellIndex: number) => FieldMember | undefined
  getCellPath: (rowIndex: number, cellIndex: number) => any[] | undefined
  getCellLabel: (rowIndex: number, cellIndex: number) => string
  renderInput: ObjectInputProps['renderInput']
  renderBlock: ObjectInputProps['renderBlock']
  renderInlineBlock: ObjectInputProps['renderInlineBlock']
  renderAnnotation: ObjectInputProps['renderAnnotation']
  renderField: ObjectInputProps['renderField']
  renderItem: ObjectInputProps['renderItem']
  renderPreview: ObjectInputProps['renderPreview']
  onClose: () => void
  onNavigate: (position: CellPosition) => void
  patch: OperationsAPI['patch']
}

const CellEditDialog: ComponentType<CellEditDialogProps> = ({
  position,
  totalRows,
  totalCols,
  getCellMember,
  getCellPath,
  getCellLabel,
  renderBlock,
  renderInlineBlock,
  renderAnnotation,
  renderField,
  renderInput,
  renderItem,
  renderPreview,
  onClose,
  onNavigate,
  patch,
}) => {
  const {rowIndex, cellIndex} = position
  const callbacks = useFormCallbacks()
  const [attemptedEnsure, setAttemptedEnsure] = useState(false)

  const navigateTo = useCallback(
    (nextRow: number, nextCell: number) => {
      if (nextRow < 0 || nextRow >= totalRows) return
      if (nextCell < 0 || nextCell >= totalCols) return
      const member = getCellMember(nextRow, nextCell)
      if (!member) return
      onNavigate({rowIndex: nextRow, cellIndex: nextCell, cellKey: `${nextRow}-${nextCell}`})
    },
    [totalRows, totalCols, getCellMember, onNavigate],
  )

  const handlePrev = useCallback(() => {
    if (cellIndex > 0) navigateTo(rowIndex, cellIndex - 1)
    else if (rowIndex > 0) navigateTo(rowIndex - 1, totalCols - 1)
  }, [rowIndex, cellIndex, totalCols, navigateTo])

  const handleNext = useCallback(() => {
    if (cellIndex < totalCols - 1) navigateTo(rowIndex, cellIndex + 1)
    else if (rowIndex < totalRows - 1) navigateTo(rowIndex + 1, 0)
  }, [rowIndex, cellIndex, totalCols, totalRows, navigateTo])

  // Grab the member if it exists
  const contentMember = getCellMember(rowIndex, cellIndex)
  const label = getCellLabel(rowIndex, cellIndex)
  const hasPrev = rowIndex > 0 || cellIndex > 0
  const hasNext = rowIndex < totalRows - 1 || cellIndex < totalCols - 1

  // If the content member is missing, set it if missing (once)
  useEffect(() => {
    if (contentMember || attemptedEnsure) return
    const cellPath = getCellPath(rowIndex, cellIndex)
    if (!cellPath) return
    setAttemptedEnsure(true)
    const contentPathStr = pathToString([...cellPath, 'content'])
    patch.execute([{setIfMissing: {[contentPathStr]: []}}])
  }, [contentMember, attemptedEnsure, getCellPath, rowIndex, cellIndex, patch])

  // Patch rewrite to anchor patches to the cell's content path
  const cellBasePath = contentMember?.field?.path?.slice(0, -1) ?? []
  const patchedCallbacks = {
    ...callbacks,
    onChange: (event: any) => {
      if (!event?.patches) {
        callbacks.onChange?.(event)
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
    <Dialog
      id="cell-edit-dialog"
      header={
        <Flex align="center" justify="space-between" gap={2} style={{width: '100%'}}>
          <Text size={1} weight="semibold">
            {label}
          </Text>
          <Flex gap={1}>
            <Button
              icon={ArrowLeftIcon}
              mode="bleed"
              padding={2}
              disabled={!hasPrev}
              onClick={handlePrev}
              aria-label="Previous cell (Shift+Tab)"
              title="Previous cell (Shift+Tab)"
            />
            <Button
              icon={ArrowRightIcon}
              mode="bleed"
              padding={2}
              disabled={!hasNext}
              onClick={handleNext}
              aria-label="Next cell (Tab)"
              title="Next cell (Tab)"
            />
            <Button
              icon={CloseIcon}
              mode="bleed"
              padding={2}
              onClick={onClose}
              aria-label="Close"
              title="Close (Escape)"
            />
          </Flex>
        </Flex>
      }
      onClose={onClose}
      width={1}
      __unstable_hideCloseButton
    >
      <Box padding={4}>
        {contentMember ? (
          <FormCallbacksProvider {...patchedCallbacks}>
            <MemberField
              member={contentMember}
              renderInput={renderInput}
              renderField={renderField}
              renderItem={renderItem}
              renderPreview={renderPreview}
              renderBlock={renderBlock}
              renderInlineBlock={renderInlineBlock}
              renderAnnotation={renderAnnotation}
            />
          </FormCallbacksProvider>
        ) : (
          <Card padding={3} tone="caution" radius={2}>
            <Text size={1} muted>
              No content field found for this cell. Initializing…
            </Text>
          </Card>
        )}
      </Box>
    </Dialog>
  )
}

export default CellEditDialog
