import {PatchOperations} from '@sanity/types'
import {Box, Card, Flex, TextInput} from '@sanity/ui'
import {ChangeEvent, ComponentType, useCallback, useState} from 'react'
import {ObjectItem, OperationsAPI} from 'sanity'
import {styled} from 'styled-components'

import {ColumnHeader} from '../schemas/columnHeader.object'
import {RichTableType} from '../schemas/richTable.object'
import {getLetterBasedOnIndex} from '../utils/getLetterBasedOnIndex'
import ColumnContextMenu from './ColumnContextMenu'

const StyledCard = styled(Card)<{$isFocused?: boolean}>`
  max-height: 50px;

  //border: unset;
  [data-border] {
    box-shadow: unset;
  }
`

interface ColumnHeaderWithInputProps {
  columnHeader: ColumnHeader & ObjectItem
  /** Patch function from Sanity document operations for optimistic changes */
  patch: OperationsAPI['patch']
  value: RichTableType
  path: string
  columnIndex: number
  rowCount: number
  columnCount: number
  readOnly: boolean | undefined
  role?: string
}

export const ColumnHeaderWithInput: ComponentType<ColumnHeaderWithInputProps> = ({
  columnHeader,
  patch,
  path,
  columnIndex,
  rowCount,
  columnCount,
  value,
  readOnly,
}) => {
  const [title, setTitle] = useState(columnHeader.title || '')
  const [isFocused, setIsFocused] = useState(false)

  const newColumnTitle = getLetterBasedOnIndex(columnIndex)
  const id = `column-header-input-${path}-${columnHeader._key}`
  // key that includes the external title will force remount when that title changes elsewhere
  const remountKey = `${columnHeader._key}-${(columnHeader.title ?? '').replace(/[^a-zA-Z0-9-_:.]/g, '-')}`

  const handleChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const newTitle = event.target.value
    setTitle(newTitle)
  }, [])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    if (readOnly) return
    // Only send a patch when the title actually changed
    if (title !== columnHeader.title) {
      const setPatch: PatchOperations = {
        set: {
          [`${path}.columnHeaders[_key=="${columnHeader._key}"].title`]: title,
        },
      }
      patch.execute([setPatch])
    }
  }, [title, patch, path, columnHeader._key, columnHeader.title, readOnly])

  return (
    <StyledCard
      shadow={isFocused ? 1 : undefined}
      tone={isFocused ? 'primary' : undefined}
      paddingX={1}
      paddingY={0}
    >
      <Flex justify={'space-between'} align={'center'} gap={1}>
        <Box flex={1}>
          <TextInput
            id={id}
            key={remountKey}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleBlur()
              }
            }}
            value={title}
            aria-label={`Column ${columnIndex + 1} title`}
            weight={'semibold'}
            onFocus={() => setIsFocused(true)}
            style={{
              textAlign: 'center',
              textOverflow: 'ellipsis',
              color: 'var(--card-muted-fg-color)',
              width: '100%',
              whiteSpace: 'nowrap',
            }}
            title={title}
            padding={0}
            placeholder={newColumnTitle}
            disabled={readOnly}
          />
        </Box>
        <ColumnContextMenu
          patch={patch}
          path={path}
          value={value}
          columnHeaderKey={columnHeader._key}
          columnIndex={columnIndex}
          rowCount={rowCount}
          columnCount={columnCount}
          readOnly={readOnly}
        />
      </Flex>
    </StyledCard>
  )
}

export default ColumnHeaderWithInput
