import {UploadIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Checkbox,
  Dialog,
  Flex,
  Label,
  Select,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Text,
  TextArea,
} from '@sanity/ui'
import {type ChangeEvent, type ClipboardEvent, useCallback, useMemo, useRef, useState} from 'react'

import {cellToText} from './cellToText'
import {detectFormat} from './detectFormat'
import {parseCsvTable} from './parseCsvTable'
import {ACCEPTED_FILE_EXTENSIONS, parseFile} from './parseFile'
import {parseHtmlTable} from './parseHtmlTable'
import {parseMarkdownTable} from './parseMarkdownTable'
import {parseTsvTable} from './parseTsvTable'
import {TablePreview} from './TablePreview'
import {type RichTableValue, toRichTableValue} from './toRichTableValue'
import type {CellValue, ParsedTable, ParseResult, ParseWarning, TableFormat} from './types'
import {MAX_IMPORT_ROWS} from './types'

/**
 * Lazily loads the XLSX parser so the heavy SheetJS dependency is only
 * downloaded when the user actually uploads an Excel file.
 */
async function parseXlsxTable(
  ...args: Parameters<(typeof import('./parseXlsxTable'))['parseXlsxTable']>
) {
  const mod = await import('./parseXlsxTable')
  return mod.parseXlsxTable(...args)
}

type TabId = 'paste' | 'upload'

interface TableImportDialogProps {
  onClose: () => void
  /**
   * Called with the fully converted rich table value when the user confirms.
   * `format` is the detected (or explicitly selected) source format so callers
   * can decide whether the import contained rich content.
   */
  onConfirm: (value: RichTableValue, result: ParseResult, format: TableFormat) => void
}

const FORMAT_LABELS: Record<string, string> = {
  html: 'HTML Table',
  markdown: 'Markdown Table',
  tsv: 'Tab-Separated',
  csv: 'CSV',
  xlsx: 'Excel',
}

/**
 * Modal dialog for importing table data from clipboard paste or file upload.
 *
 * Supports auto-detection of HTML tables, Markdown tables, TSV, and CSV from
 * pasted content, and CSV/TSV/XLS/XLSX via file upload. Shows a live preview
 * of the parsed table before insertion.
 */
export function TableImportDialog({onClose, onConfirm}: TableImportDialogProps) {
  const [activeTab, setActiveTab] = useState<TabId>('paste')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [detectedFormat, setDetectedFormat] = useState<TableFormat | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [pasteDisplay, setPasteDisplay] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)

  const [xlsxBuffer, setXlsxBuffer] = useState<ArrayBuffer | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>('')

  const [useColumnHeaders, setUseColumnHeaders] = useState(false)
  const [useRowTitles, setUseRowTitles] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetState = useCallback(() => {
    setParseResult(null)
    setDetectedFormat(null)
    setError(null)
    setPasteDisplay('')
    setFileName(null)
    setXlsxBuffer(null)
    setSheetNames([])
    setSelectedSheet('')
    setUseColumnHeaders(false)
    setUseRowTitles(false)
  }, [])

  /**
   * Sets a new parse result and initialises the header toggles from whatever
   * the parser auto-detected, so the checkboxes reflect the data out of the box.
   */
  const applyParseResult = useCallback((result: ParseResult | null) => {
    setParseResult(result)
    if (result) {
      setUseColumnHeaders(result.table.headers !== null)
      setUseRowTitles(result.table.hasRowTitles ?? false)
    }
  }, [])

  /**
   * Restructured table and adjusted warnings that reflect the user's header
   * toggle choices. Promotes/demotes the first row and shifts warning row
   * indices so the preview highlighting stays aligned with the visible rows.
   */
  const {effectiveTable, effectiveWarnings} = useMemo<{
    effectiveTable: ParsedTable | null
    effectiveWarnings: ParseWarning[]
  }>(() => {
    if (!parseResult) return {effectiveTable: null, effectiveWarnings: []}
    const raw = parseResult.table
    const rawWarnings = parseResult.warnings
    const hadHeaders = raw.headers !== null

    let headers: string[] | null = raw.headers
    let rows = raw.rows
    let warnings = rawWarnings

    if (useColumnHeaders && !hadHeaders && rows.length > 0) {
      headers = rows[0].map(cellToText)
      rows = rows.slice(1)
      warnings = rawWarnings.filter((w) => w.row > 0).map((w) => ({...w, row: w.row - 1}))
    } else if (!useColumnHeaders && hadHeaders) {
      rows = [raw.headers!.map((h): CellValue => h), ...rows]
      headers = null
      warnings = rawWarnings.map((w) => ({...w, row: w.row + 1}))
    }

    return {
      effectiveTable: {headers, rows, hasRowTitles: useRowTitles},
      effectiveWarnings: warnings,
    }
  }, [parseResult, useColumnHeaders, useRowTitles])

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault()
      resetState()

      const html = e.clipboardData.getData('text/html')
      const plain = e.clipboardData.getData('text/plain')
      const format = detectFormat(html, plain)

      if (!format) {
        setError(
          'No table data detected. Try copying cells from a spreadsheet, or switch to the Upload tab for file imports.',
        )
        setPasteDisplay(plain.slice(0, 500))
        return
      }

      setDetectedFormat(format)
      setPasteDisplay(plain.slice(0, 500))

      const input = format === 'html' ? html : plain
      const parsers: Record<Exclude<TableFormat, 'csv' | 'xlsx'>, (s: string) => ParseResult> = {
        html: parseHtmlTable,
        markdown: parseMarkdownTable,
        tsv: parseTsvTable,
      }
      const parser = parsers[format as Exclude<TableFormat, 'csv' | 'xlsx'>]

      if (!parser) {
        setError(`Unsupported format: ${format}`)
        return
      }

      const result = parser(input)
      if (result.table.rows.length === 0) {
        setError('The pasted data was recognised as a table but contained no rows.')
        return
      }

      applyParseResult(result)
    },
    [resetState, applyParseResult],
  )

  /** Lets users explicitly parse textarea content as CSV (not auto-detected). */
  const handleParseAsCsv = useCallback(() => {
    if (!pasteDisplay) return
    setError(null)
    setDetectedFormat('csv')
    const result = parseCsvTable(pasteDisplay)
    if (result.table.rows.length === 0) {
      setError('No rows found when parsing as CSV.')
      return
    }
    applyParseResult(result)
  }, [pasteDisplay, applyParseResult])

  const handleFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      resetState()
      setFileName(file.name)
      setLoading(true)

      try {
        const ext = file.name.split('.').pop()?.toLowerCase()

        if (ext === 'xls' || ext === 'xlsx') {
          const buffer = await file.arrayBuffer()
          setXlsxBuffer(buffer)

          const xlsxResult = await parseXlsxTable(buffer)
          setSheetNames(xlsxResult.sheetNames)
          if (xlsxResult.sheetNames.length > 0) {
            setSelectedSheet(xlsxResult.sheetNames[0])
          }
          setDetectedFormat('xlsx')
          if (xlsxResult.table.rows.length === 0) {
            setError('The selected sheet contains no data rows.')
          } else {
            applyParseResult(xlsxResult)
          }
        } else {
          const result = await parseFile(file)
          if (!result) {
            setError(`Unsupported file type: .${ext ?? 'unknown'}`)
          } else if (result.table.rows.length === 0) {
            setError('The file was parsed but contained no data rows.')
          } else {
            setDetectedFormat(ext === 'tsv' ? 'tsv' : 'csv')
            applyParseResult(result)
          }
        }
      } catch (err) {
        setError(`Failed to read file: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setLoading(false)
      }
    },
    [resetState],
  )

  const handleSheetChange = useCallback(
    async (e: ChangeEvent<HTMLSelectElement>) => {
      const sheet = e.currentTarget.value
      setSelectedSheet(sheet)
      setError(null)

      if (!xlsxBuffer) return

      const result = await parseXlsxTable(xlsxBuffer, sheet)
      if (result.table.rows.length === 0) {
        setError('The selected sheet contains no data rows.')
        applyParseResult(null)
      } else {
        applyParseResult(result)
      }
    },
    [xlsxBuffer, applyParseResult],
  )

  const handleConfirm = useCallback(() => {
    if (!effectiveTable || !parseResult || !detectedFormat) return
    const value = toRichTableValue(effectiveTable)
    onConfirm(value, parseResult, detectedFormat)
  }, [effectiveTable, parseResult, detectedFormat, onConfirm])

  const warnings = effectiveWarnings
  const rowCount = effectiveTable?.rows.length ?? 0
  const colCount = effectiveTable
    ? Math.max(effectiveTable.headers?.length ?? 0, ...effectiveTable.rows.map((r) => r.length))
    : 0
  const formatLabel = detectedFormat
    ? (FORMAT_LABELS[detectedFormat] ?? detectedFormat.toUpperCase())
    : null

  return (
    <Dialog
      id="table-import-dialog"
      header="Import Table"
      width={2}
      onClose={onClose}
      footer={
        <Box padding={3}>
          <Flex justify="flex-end" gap={2}>
            <Button text="Cancel" mode="ghost" onClick={onClose} />
            <Button
              text="Import"
              tone="primary"
              icon={UploadIcon}
              disabled={!parseResult || rowCount === 0}
              onClick={handleConfirm}
            />
          </Flex>
        </Box>
      }
    >
      <Box padding={4}>
        <Stack space={4}>
          <TabList space={1}>
            <Tab
              id="tab-paste"
              label="Paste"
              aria-controls="panel-paste"
              selected={activeTab === 'paste'}
              onClick={() => {
                setActiveTab('paste')
                resetState()
              }}
            />
            <Tab
              id="tab-upload"
              label="Upload File"
              aria-controls="panel-upload"
              selected={activeTab === 'upload'}
              onClick={() => {
                setActiveTab('upload')
                resetState()
              }}
            />
          </TabList>

          <TabPanel id="panel-paste" aria-labelledby="tab-paste" hidden={activeTab !== 'paste'}>
            <Stack space={3}>
              <Text size={1} muted>
                Paste table data from a spreadsheet, web page, or markdown document. The format is
                detected automatically.
              </Text>
              <TextArea
                aria-label="Paste table data"
                placeholder="Paste table data here (Ctrl/⌘+V)…"
                value={pasteDisplay}
                readOnly
                onPaste={handlePaste}
                rows={5}
                fontSize={1}
              />
              {pasteDisplay && !parseResult && !error && (
                <Button text="Parse as CSV" mode="ghost" fontSize={1} onClick={handleParseAsCsv} />
              )}
            </Stack>
          </TabPanel>

          <TabPanel id="panel-upload" aria-labelledby="tab-upload" hidden={activeTab !== 'upload'}>
            <Stack space={3}>
              <Text size={1} muted>
                Upload a CSV, TSV, or Excel file (.xls, .xlsx).
              </Text>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FILE_EXTENSIONS}
                onChange={handleFileChange}
                style={{display: 'none'}}
              />
              <Flex gap={2} align="center">
                <Button
                  text="Choose File"
                  icon={UploadIcon}
                  mode="ghost"
                  onClick={() => fileInputRef.current?.click()}
                />
                {fileName && (
                  <Text size={1} muted>
                    {fileName}
                  </Text>
                )}
                {loading && <Spinner muted />}
              </Flex>

              {sheetNames.length > 1 && (
                <Flex gap={2} align="center">
                  <Label size={1}>Sheet</Label>
                  <Select
                    fontSize={1}
                    value={selectedSheet}
                    onChange={handleSheetChange}
                    style={{maxWidth: 240}}
                  >
                    {sheetNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </Select>
                </Flex>
              )}
            </Stack>
          </TabPanel>

          {error && (
            <Card padding={3} radius={2} tone="critical">
              <Text size={1}>{error}</Text>
            </Card>
          )}

          {parseResult && effectiveTable && rowCount > 0 && (
            <Stack space={3}>
              <Flex gap={2} align="center">
                {formatLabel && (
                  <Card padding={2} radius={2} tone="primary">
                    <Text size={0} weight="medium">
                      {formatLabel}
                    </Text>
                  </Card>
                )}
                <Text size={1} muted>
                  {colCount} columns × {rowCount} rows
                </Text>
              </Flex>

              {parseResult.totalRows && parseResult.totalRows > MAX_IMPORT_ROWS && (
                <Card padding={3} radius={2} tone="caution">
                  <Text size={1}>
                    The source table has {parseResult.totalRows} rows. Only the first{' '}
                    {MAX_IMPORT_ROWS} rows will be imported.
                  </Text>
                </Card>
              )}

              <Flex gap={4}>
                <Flex as="label" gap={2} align="center" style={{cursor: 'pointer'}}>
                  <Checkbox
                    checked={useColumnHeaders}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setUseColumnHeaders(e.currentTarget.checked)
                    }
                  />
                  <Text size={1}>First row is column headers</Text>
                </Flex>
                <Flex as="label" gap={2} align="center" style={{cursor: 'pointer'}}>
                  <Checkbox
                    checked={useRowTitles}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setUseRowTitles(e.currentTarget.checked)
                    }
                  />
                  <Text size={1}>First column is row headers</Text>
                </Flex>
              </Flex>

              {warnings.length > 0 && (
                <Card padding={2} radius={2} tone="caution">
                  <Text size={0}>
                    {warnings.length} cell(s) could not be fully imported and will show
                    placeholders.
                  </Text>
                </Card>
              )}
              <TablePreview
                table={effectiveTable}
                warnings={warnings}
                hasRowTitles={useRowTitles}
              />
            </Stack>
          )}
        </Stack>
      </Box>
    </Dialog>
  )
}
