import {Box, Button, Flex, Text} from '@sanity/ui'
import {ComponentType} from 'react'

import CommandListItem from './CommandListItem'
import {CommandMatch} from './commands'

export interface CommandListBoxProps {
  keyword: string
  matches: readonly CommandMatch[]
  selectedIndex: number
  onDismiss: () => void
  onNavigateTo: (index: number) => void
  onSelect: () => void
}

const CommandListBox: ComponentType<CommandListBoxProps> = (props) => {
  if (props.matches.length === 0) {
    return (
      <Flex padding={2} align={'center'}>
        <Box>
          <Text size={1}>No commands matching &quot;{props.keyword}&quot;</Text>
        </Box>
        <Button onClick={props.onDismiss}>Dismiss</Button>
      </Flex>
    )
  }

  return (
    <Flex
      direction={'column'}
      gap={4}
      as={'ol'}
      padding={1}
      style={{maxHeight: 300, minWidth: 220, overflowY: 'auto', listStyle: 'none'}}
      aria-orientation={'vertical'}
      role="listbox"
      aria-label="Available commands"
    >
      {props.matches.map((match, index) => (
        <CommandListItem
          key={match.key}
          match={match}
          selected={props.selectedIndex === index}
          onMouseEnter={() => props.onNavigateTo(index)}
          onSelect={props.onSelect}
        />
      ))}
    </Flex>
  )
}
export default CommandListBox
