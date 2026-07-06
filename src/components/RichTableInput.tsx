import {ExpandIcon, ResetIcon, UploadIcon} from '@sanity/icons'
import {Box, Button, Flex, Inline, Stack, Switch, Text, Tooltip, useToast} from '@sanity/ui'
import {ChangeEvent, ComponentType, Suspense, useCallback, useMemo, useState} from 'react'
import {
  getPublishedId,
  getVersionFromId,
  isIndexSegment,
  isKeySegment,
  ObjectInputProps,
  pathToString,
  useDocumentOperation,
  useFormValue,
  useSchema,
} from 'sanity'
import styled from 'styled-components'

import {useDialogRouteState} from '../hooks/useDialogRouteState'
import {useToggleTitles} from '../hooks/useToggleTitles'
import {useRegisterTableImport} from '../import/TableImportContext'
import {TableImportDialog} from '../import/TableImportDialog'
import {getToastForResult} from '../import/toastMessages'
import type {RichTableValue} from '../import/toRichTableValue'
import type {ParseResult, TableFormat} from '../import/types'
import {RichTableType} from '../schemas/richTable.object'
import {isRichTableArrayMemberContext} from '../utils/isRichTableArrayMemberContext'
import ConfirmClearTableDialog from './ConfirmClearTableDialog'
import ExpandedTableDialog from './ExpandedTableDialog'
import InitialiseTable from './InitialiseTable'
import LoadingIndicator from './LoadingIndicator'
import Table from './Table'

const HiddenInputBox = styled(Box)<{$debug?: boolean}>`
  // only hide visually but keep it in the DOM unless in debug mode
  ${(props) =>
    props.$debug
      ? ''
      : `
  border: 0 !important;
  clip: rect(1px, 1px, 1px, 1px) !important;
  -webkit-clip-path: inset(50%) !important;
          clip-path: inset(50%) !important;
  height: 1px !important;
  margin: -1px !important;
  overflow: hidden !important;
  padding: 0 !important;
  position: absolute !important;
  width: 1px !important;
`}
`

const RichTableInput: ComponentType<
  ObjectInputProps<RichTableType> & {
    isInPortableText?: boolean
    portableTextSchemaTypeName?: string
  }
> = (props) => {
  const _id = useFormValue(['_id']) as string
  const _type = useFormValue(['_type']) as string
  const schema = useSchema()

  // Document operations -> with optimistic changes
  // Pass the version/release id so patches target the edited perspective
  // (release version) instead of always writing to drafts. See SYS-138.
  const {patch} = useDocumentOperation(getPublishedId(_id), _type, getVersionFromId(_id))

  const pathString = pathToString(props.path)

  const isInArray = useMemo(
    () =>
      isRichTableArrayMemberContext({
        schema,
        documentTypeName: _type,
        path: props.path,
        objectSchemaTypeName: props.schemaType.name,
        isInPortableText: props.isInPortableText,
      }),
    [_type, props.isInPortableText, props.path, props.schemaType.name, schema],
  )

  // Whether this table is an array item or Portable Text block (vs. a plain
  // object field) — from the path's last segment, so it holds regardless of the
  // array member's schema name (e.g. a custom `richTableItem`). These have no
  // field-actions menu, so they get an inline import button instead of the
  // "Import table" field action used on object fields.
  const lastPathSegment = props.path[props.path.length - 1]
  const isArrayItemOrBlock =
    Boolean(props.isInPortableText) ||
    isKeySegment(lastPathSegment) ||
    isIndexSegment(lastPathSegment)

  // table ID
  const tableId = `table-${props.id}`

  // * Debug mode
  const [debug, setDebug] = useState(false)
  const handleDebugChange = useCallback(() => setDebug(!debug), [debug])
  // * Expand table dialog — open/closed state lives in the Structure tool URL params
  // (deep-linkable, refresh-persistent, back-button closes), keyed by field path so
  // only the matching table opens. Falls back to local state outside Structure.
  const {open: openDialog, handleOpen, handleClose} = useDialogRouteState(pathString)
  // * Confirm clear table dialog
  const [openConfirmClearDialog, setOpenConfirmClearDialog] = useState(false)
  const handleOpenConfirmClearDialog = useCallback(() => setOpenConfirmClearDialog(true), [])
  const handleCloseConfirmClearDialog = useCallback(() => setOpenConfirmClearDialog(false), [])
  // * Import table dialog
  const toast = useToast()
  const [openImportDialog, setOpenImportDialog] = useState(false)
  const handleOpenImportDialog = useCallback(() => setOpenImportDialog(true), [])
  const handleCloseImportDialog = useCallback(() => setOpenImportDialog(false), [])

  // Writes the imported table into this field via document operations.
  // `setIfMissing` establishes the container object when the field is empty
  // (avoiding "deep operations on primitive values" — SAPP-3812) WITHOUT
  // clobbering an array item's / PT block's `_key` and `_type`; the fields are
  // then set on it. A single `patch.execute` is required — an `onChange({})`
  // reset first would wipe an array item's `_key`, so the keyed path no longer
  // matched and the import silently failed to land.
  const applyImportedTable = useCallback(
    (imported: RichTableValue) => {
      patch.execute([
        {setIfMissing: {[pathString]: {}}},
        {
          set: {
            [`${pathString}.rows`]: imported.rows,
            [`${pathString}.columnHeaders`]: imported.columnHeaders,
            [`${pathString}.hasColumnTitles`]: imported.hasColumnTitles,
            [`${pathString}.hasRowTitles`]: imported.hasRowTitles,
          },
        },
      ])
    },
    [patch, pathString],
  )

  const handleImportConfirm = useCallback(
    (value: RichTableValue, result: ParseResult, format: TableFormat) => {
      applyImportedTable(value)
      setOpenImportDialog(false)
      // TSV/CSV are plain text; everything else can carry rich formatting.
      const isRichFormat = format !== 'tsv' && format !== 'csv'
      toast.push(getToastForResult(result, result.totalRows, isRichFormat))
    },
    [applyImportedTable, toast],
  )

  // Expose this field's import dialog to the "Import table" field action, which
  // (being a menu descriptor) cannot render the dialog itself.
  useRegisterTableImport(pathString, handleOpenImportDialog)

  const {hasColumnTitles, hasRowTitles} = props.value || {}
  const {toggleColumnTitles, toggleRowTitles} = useToggleTitles(
    hasColumnTitles,
    hasRowTitles,
    patch,
    pathString,
  )

  return (
    <Stack space={4} as={'section'} aria-label={'Rich table input'}>
      <Suspense fallback={<LoadingIndicator />} name={'RichTableInput Suspense'}>
        {!props.value?.rows && (
          <Stack space={3}>
            <InitialiseTable
              patch={patch}
              path={pathString}
              isInPortableText={props.isInPortableText}
              isInArray={isInArray}
              readOnly={props.readOnly}
              onChange={props.onChange}
            />
            {/* Array items and Portable Text blocks have no field-actions menu,
                so the import trigger is shown inline; object fields use the
                "Import table" field action instead. */}
            {isArrayItemOrBlock && !props.readOnly && (
              <Box>
                <Button
                  icon={UploadIcon}
                  text={'Import table'}
                  mode={'ghost'}
                  fontSize={1}
                  onClick={handleOpenImportDialog}
                  aria-haspopup="dialog"
                  aria-expanded={openImportDialog}
                  type="button"
                />
              </Box>
            )}
          </Stack>
        )}
        {props.value && props.value.rows && (
          <>
            <Box>
              {/* EXPAND TABLE BUTTON */}
              <Flex justify={'flex-end'} gap={4}>
                {/* Import/replace lives inline for array items and Portable Text
                    blocks (no field-actions menu there); object fields use the field action. */}
                {isArrayItemOrBlock && (
                  <Tooltip
                    content={
                      <Box>
                        <Text size={1}>Import / replace table</Text>
                      </Box>
                    }
                    portal
                  >
                    <Button
                      iconRight={UploadIcon}
                      onClick={handleOpenImportDialog}
                      mode={'bleed'}
                      fontSize={0}
                      text={'Import'}
                      muted
                      disabled={props.readOnly}
                      aria-label={'Import or replace table'}
                      aria-haspopup="dialog"
                      aria-expanded={openImportDialog}
                      aria-controls={tableId}
                      type="button"
                    />
                  </Tooltip>
                )}
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
                    aria-label={'Clear table'}
                    aria-controls={tableId}
                    type="button"
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
                    aria-label={
                      props.isInPortableText && !props.readOnly
                        ? 'Open table to edit'
                        : 'Expand table'
                    }
                    aria-haspopup="dialog"
                    aria-expanded={openDialog}
                    aria-controls={tableId}
                    type="button"
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
                id={tableId}
                portableTextSchemaTypeName={props.portableTextSchemaTypeName}
              />
            </Box>
            {openDialog && (
              <ExpandedTableDialog {...props} isInDialog handleClose={handleClose} patch={patch} />
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
          readOnly={props.readOnly}
        />
      )}
      {openImportDialog && (
        <TableImportDialog onClose={handleCloseImportDialog} onConfirm={handleImportConfirm} />
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
      {/* TEST WITH HIDDEN BUT RENDERED INPUT */}
      <HiddenInputBox $debug={debug}>{props.renderDefault(props)}</HiddenInputBox>
      {/*      {debug &&
        // Default inputs (rows, columnHeaders)
        props.renderDefault(props)}*/}
    </Stack>
  )
}

export default RichTableInput
