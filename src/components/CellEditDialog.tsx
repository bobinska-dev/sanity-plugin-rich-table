import {ArrowLeftIcon, ArrowRightIcon, CloseIcon} from '@sanity/icons'
import {Box, Button, Card, Dialog, Flex, Text} from '@sanity/ui'
import {ComponentType, useCallback, useEffect, useRef} from 'react'
import {FieldMember, MemberField, ObjectInputProps, OperationsAPI, pathToString} from 'sanity'
// or
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
  const editorFixedRef = useRef(false)
  const callbacks = useFormCallbacks()

  // Restore other editors on unmount
  useEffect(() => {
    return () => {
      document.querySelectorAll<HTMLElement>('[data-rich-table-disabled]').forEach((el) => {
        el.setAttribute('contenteditable', 'true')
        el.removeAttribute('data-rich-table-disabled')
      })
    }
  }, [])

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
    if (cellIndex > 0) {
      navigateTo(rowIndex, cellIndex - 1)
    } else if (rowIndex > 0) {
      navigateTo(rowIndex - 1, totalCols - 1)
    }
  }, [rowIndex, cellIndex, totalCols, navigateTo])

  const handleNext = useCallback(() => {
    if (cellIndex < totalCols - 1) {
      navigateTo(rowIndex, cellIndex + 1)
    } else if (rowIndex < totalRows - 1) {
      navigateTo(rowIndex + 1, 0)
    }
  }, [rowIndex, cellIndex, totalCols, totalRows, navigateTo])

  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     const active = document.activeElement
  //     const isInEditor = active?.closest('[data-slate-editor]')
  //     if (e.key === 'Escape') {
  //       onClose()
  //       return
  //     }
  //     if (e.key === 'Tab' && !isInEditor) {
  //       e.preventDefault()
  //       if (e.shiftKey) {
  //         handlePrev()
  //       } else {
  //         handleNext()
  //       }
  //     }
  //   }
  //   window.addEventListener('keydown', handleKeyDown)
  //   return () => window.removeEventListener('keydown', handleKeyDown)
  // }, [handleNext, handlePrev, onClose])

  const contentMember = getCellMember(rowIndex, cellIndex)
  const contentSchemaType = contentMember?.field?.schemaType as any
  console.log('[cell content schemaType name]', contentSchemaType?.name)
  console.log('[cell content schemaType of[0] keys]', Object.keys(contentSchemaType?.of?.[0] ?? {}))
  console.log('[cell content schemaType of[0] name]', contentSchemaType?.of?.[0]?.name)
  const blockMember = (contentMember?.field?.schemaType as any)?.of?.[0]
  console.log('[block member]', {
    name: blockMember?.name,
    jsonType: blockMember?.jsonType,
    typeName: blockMember?.type?.name,
    hasMarks: !!blockMember?.marks,
    hasStyles: !!blockMember?.styles,
    hasLists: !!blockMember?.lists,
    typeJsonType: blockMember?.type?.jsonType,
    parentTypeName: blockMember?.type?.type?.name,
  })
  const cellBasePath = contentMember?.field?.path?.slice(0, -1) ?? []

  const patchedCallbacks = {
    ...callbacks,
    onChange: (event: any) => {
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
  // console.log('[contentMember.onChange]', typeof contentMember?.onChange, contentMember?.onChange)
  console.log('[contentMember keys]', Object.keys(contentMember ?? {}))
  const label = getCellLabel(rowIndex, cellIndex)
  const hasPrev = rowIndex > 0 || cellIndex > 0
  const hasNext = rowIndex < totalRows - 1 || cellIndex < totalCols - 1

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
              No content field found for this cell.
            </Text>
          </Card>
        )}
      </Box>
    </Dialog>
  )
}

export default CellEditDialog
