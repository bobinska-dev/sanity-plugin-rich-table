import {PatchOperations} from '@sanity/types'
import {Box, Card, Flex, TextInput} from '@sanity/ui'
import {ChangeEvent, ComponentType, useCallback, useState} from 'react'
import {OperationsAPI} from 'sanity'
import {styled} from 'styled-components'

import {RichTableRowType} from '../schemas/row.object'
import RowContextMenu from './RowContextMenu'

const StyledCard = styled(Card)<{$isFocused?: boolean}>`
  flex: 1;
  min-width: 0;
  border: unset;

  [data-border] {
    box-shadow: unset;
  }

  overflow: hidden;
`

interface RowHeaderWithInputProps {
  row: RichTableRowType
  /** Patch function from Sanity document operations for optimistic changes */
  patch: OperationsAPI['patch']
  rowIndex: number
  rowCount: number
  readOnly: boolean | undefined
  path: string
  role?: string
}

/** Row header component with input field for editing the row title */
const RowHeaderWithInput: ComponentType<RowHeaderWithInputProps> = ({
  row,
  patch,
  path,
  rowIndex,
  rowCount,
  readOnly,
}) => {
  const [title, setTitle] = useState(row.title || '')
  const [isFocused, setIsFocused] = useState(false)

  const inputId = `row-header-input-${row._key}`
  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const newTitle = event.target.value
    setTitle(newTitle)
  }, [])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    const setPatch: PatchOperations = {
      set: {
        [`${path}.rows[_key=="${row._key}"].title`]: title,
      },
    }
    return patch.execute([setPatch])
  }, [path, row._key, title, patch])

  const newRowTitle = `${rowIndex ? rowIndex + 1 : 1}`
  return (
    <Flex
      direction="row"
      gap={1}
      justify="flex-start"
      align="center"
      marginLeft={1}
      style={{width: '100%', minWidth: 0}}
    >
      <StyledCard
        shadow={isFocused ? 1 : undefined}
        tone={isFocused ? 'primary' : undefined}
        paddingLeft={1}
      >
        <TextInput
          id={inputId}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleBlur()
            }
          }}
          value={title}
          aria-label={`Row ${rowIndex + 1} title`}
          weight={'semibold'}
          onFocus={() => setIsFocused(true)}
          style={{
            width: '100%',
            textAlign: 'center',
            textOverflow: 'ellipsis',
            color: 'var(--card-muted-fg-color)',
          }}
          disabled={readOnly}
          title={title}
          padding={0}
          placeholder={newRowTitle}
        />
      </StyledCard>

      <Box flex="none" style={{flexShrink: 0}}>
        <RowContextMenu
          row={row}
          patch={patch}
          path={path}
          rowIndex={rowIndex}
          rowCount={rowCount}
          readOnly={readOnly}
        />
      </Box>
    </Flex>
  )
}

export default RowHeaderWithInput
