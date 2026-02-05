import {ExpandIcon, ResetIcon} from '@sanity/icons'
import {Box, Button, Flex, Inline, Stack, Switch, Text, Tooltip} from '@sanity/ui'
import {ChangeEvent, ComponentType, Suspense, useCallback, useState} from 'react'
import {
  getPublishedId,
  ObjectInputProps,
  pathToString,
  useDocumentOperation,
  useFormValue,
} from 'sanity'

import {useToggleTitles} from '../hooks/useToggleTitles'
import {RichTableType} from '../schemas/richTable.object'
import ConfirmClearTableDialog from './ConfirmClearTableDialog'
import ExpandedTableDialog from './ExpandedTableDialog'
import InitialiseTable from './InitialiseTable'
import LoadingIndicator from './LoadingIndicator'
import Table from './Table'

const RichTableInput: ComponentType<
  ObjectInputProps<RichTableType> & {isInPortableText?: boolean}
> = (props) => {
  const _id = useFormValue(['_id']) as string
  const _type = useFormValue(['_type']) as string

  // Document operations -> with optimistic changes
  const {patch} = useDocumentOperation(getPublishedId(_id), _type)

  const pathString = pathToString(props.path)

  // * Debug mode
  const [debug, setDebug] = useState(false)
  const handleDebugChange = useCallback(() => setDebug(!debug), [debug])
  // * Expand table dialog
  const [openDialog, setOpenDialog] = useState(false)
  const handleOpen = useCallback(() => setOpenDialog(true), [])
  const handleClose = useCallback(() => setOpenDialog(false), [])
  // * Confirm clear table dialog
  const [openConfirmClearDialog, setOpenConfirmClearDialog] = useState(false)
  const handleOpenConfirmClearDialog = useCallback(() => setOpenConfirmClearDialog(true), [])
  const handleCloseConfirmClearDialog = useCallback(() => setOpenConfirmClearDialog(false), [])

  const {hasColumnTitles, hasRowTitles} = props.value || {}
  const {toggleColumnTitles, toggleRowTitles} = useToggleTitles(
    hasColumnTitles,
    hasRowTitles,
    patch,
    pathString,
  )

  return (
    <Stack space={4}>
      <Suspense fallback={<LoadingIndicator />} name={'RichTableInput Suspense'}>
        {!props.value?.rows && (
          <InitialiseTable
            path={props.path}
            isInPortableText={props.isInPortableText}
            readOnly={props.readOnly}
            onChange={props.onChange}
          />
        )}
        {props.value && props.value.rows && (
          <>
            <Box>
              {/* EXPAND TABLE BUTTON */}
              <Flex justify={'flex-end'} gap={4}>
                <Tooltip
                  content={
                    <Box>
                      <Text size={1}>Clear table</Text>
                    </Box>
                  }
                  portal
                >
                  <Button
                    iconRight={ResetIcon}
                    onClick={handleOpenConfirmClearDialog}
                    mode={'bleed'}
                    fontSize={0}
                    text={'Clear table'}
                    muted
                    disabled={props.readOnly}
                  />
                </Tooltip>
                <Tooltip
                  content={
                    <Box>
                      <Text size={1}>Expand table</Text>
                    </Box>
                  }
                  portal
                >
                  <Button
                    iconRight={ExpandIcon}
                    onClick={handleOpen}
                    mode={'bleed'}
                    fontSize={0}
                    text={
                      props.isInPortableText && !props.readOnly
                        ? 'Open table to edit'
                        : 'Expand table'
                    }
                    muted
                    disabled={props.readOnly}
                  />
                </Tooltip>
              </Flex>

              <Table
                {...props}
                isInDialog={false}
                handleOpen={handleOpen}
                patch={patch}
                isInPortableText={props.isInPortableText}
                // We need this key to force remounting the table when opening/closing the dialog
                key={openDialog ? 'table-in-dialog-open' : 'table-in-dialog-closed'}
                readOnly={props.isInPortableText ? true : props.readOnly}
              />
            </Box>
            {openDialog && (
              <ExpandedTableDialog
                {...props}
                isInDialog={true}
                handleClose={handleClose}
                patch={patch}
              />
            )}
          </>
        )}
      </Suspense>
      {openConfirmClearDialog && (
        <ConfirmClearTableDialog
          open={openConfirmClearDialog}
          onClose={handleCloseConfirmClearDialog}
          patch={patch}
          path={pathString}
        />
      )}
      {/* DEBUG SWITCH*/}
      <Flex justify={'space-between'} align={'center'} gap={2} key={`debug-switch-${openDialog}`}>
        <Inline space={2}>
          <Switch
            checked={debug}
            onChange={handleDebugChange}
            label={'Open field to debug'}
            id={'debug-toggle'}
          />
          <Text as={'label'} htmlFor={'debug-toggle'} size={0} muted>
            Debug mode
          </Text>
        </Inline>
        <Flex gap={3} justify={'flex-end'} align={'center'}>
          <Inline space={2}>
            <Text as={'label'} htmlFor={'row-title-toggle'} size={0} muted>
              Show row titles
            </Text>
            <Switch
              checked={hasRowTitles}
              role="switch"
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                toggleRowTitles(e.currentTarget.checked)
              }
              disabled={props.readOnly}
              label={'Show row titles'}
              id={'row-title-toggle'}
            />
          </Inline>
          <Inline space={2}>
            <Text as={'label'} htmlFor={'column-title-toggle'} size={0} muted>
              Show column titles
            </Text>
            <Switch
              checked={hasColumnTitles}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                toggleColumnTitles(e.currentTarget.checked)
              }
              disabled={props.readOnly}
              label={'Show column titles'}
              id={'column-title-toggle'}
            />
          </Inline>
        </Flex>
      </Flex>
      {debug &&
        // Default inputs (rows, columnHeaders)
        props.renderDefault(props)}
    </Stack>
  )
}
export default RichTableInput
