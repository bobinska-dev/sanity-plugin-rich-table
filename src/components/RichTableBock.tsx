import {Box, Card, Stack} from '@sanity/ui'
import {ComponentType, useCallback, useState} from 'react'
import {BlockProps} from 'sanity'

import {useTableCellValidation} from '../hooks/useTableCellValidation'

const RichTableBock: ComponentType<BlockProps> = (props) => {
  const [openTable, setOpenTable] = useState<boolean>(true)
  const handleToggleOpen = useCallback(() => setOpenTable(!openTable), [openTable])
  // Surface the table's aggregated descendant markers on the native block chrome
  // (the custom input hides them otherwise), matching a normal PT block.
  const getValidation = useTableCellValidation()
  const {markers} = getValidation(props.path)
  return (
    <Card
      shadow={1}
      radius={2}
      padding={2}
      tone={props.focused ? 'primary' : 'default'}
      title="Click to collapse, double-click to edit"
      style={{cursor: 'pointer'}}
    >
      <Stack space={3}>
        <Box onClick={handleToggleOpen}>
          {props.renderDefault({
            ...props,
            open: false,
            onOpen: () => null,
            validation: markers as unknown as BlockProps['validation'],
          })}
        </Box>
        {openTable && <Box>{props.children}</Box>}
      </Stack>
    </Card>
  )
}
export default RichTableBock
