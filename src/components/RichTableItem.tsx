import {Box, Card, Stack} from '@sanity/ui'
import {ComponentType, useCallback, useState} from 'react'
import {ItemProps} from 'sanity'

const RichTableItem: ComponentType<ItemProps> = (props) => {
  const [openTable, setOpenTable] = useState<boolean>(true)
  const handleToggleOpen = useCallback(() => setOpenTable(!openTable), [openTable])
  return (
    <Card
      shadow={1}
      radius={2}
      padding={2}
      tone={props.focused ? 'primary' : 'default'}
      style={{cursor: 'pointer'}}
    >
      <Stack space={3}>
        <Box onClick={handleToggleOpen}>
          {props.renderDefault({
            ...props,
            open: false,
            onOpen: () => handleToggleOpen(),
          })}
        </Box>
        {openTable && <Box>{props.children}</Box>}
      </Stack>
    </Card>
  )
}
export default RichTableItem
