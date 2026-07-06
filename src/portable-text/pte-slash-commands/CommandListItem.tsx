import {Card, Flex, Stack, Text} from '@sanity/ui'
import {ComponentType, useEffect, useRef} from 'react'

import {CommandMatch} from './commands'

export interface CommandListItemProps {
  match: CommandMatch
  selected: boolean
  onMouseEnter: () => void
  onSelect: () => void
}

const CommandListItem: ComponentType<CommandListItemProps> = (props) => {
  // Rendered as an <li>, so the ref element type must match (@sanity/ui v6 types this strictly).
  const ref = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (props.selected && ref.current) {
      ref.current.scrollIntoView({behavior: 'smooth', block: 'nearest'})
    }
  }, [props.selected])

  return (
    <Card
      as={'li'}
      ref={ref}
      radius={2}
      padding={2}
      tone={props.selected ? 'primary' : 'default'}
      pressed={props.selected}
      onMouseEnter={props.onMouseEnter}
      onClick={props.onSelect}
      role="option"
      aria-selected={props.selected}
      aria-label={props.match.label}
      style={{cursor: 'pointer'}}
    >
      <Flex align={'center'} gap={3}>
        {/* Fixed-width, centered icon gutter at a uniform font-size so icons from
            different families (react-icons, @sanity/icons, custom) line up and the
            label always starts at the same x. */}
        <Flex
          align={'center'}
          justify={'center'}
          style={{width: '1.375rem', height: '1.375rem', flex: 'none', fontSize: '1.125rem'}}
        >
          {props.match.icon}
        </Flex>
        <Stack space={2} style={{flex: 1, minWidth: 0}}>
          <Text size={1} weight={'medium'} textOverflow={'ellipsis'}>
            {props.match.label}
          </Text>
          <Text size={0} muted textOverflow={'ellipsis'}>
            {props.match.description}
          </Text>
        </Stack>
      </Flex>
    </Card>
  )
}
export default CommandListItem
