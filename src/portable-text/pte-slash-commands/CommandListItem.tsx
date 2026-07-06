import {Button, Stack, Text} from '@sanity/ui'
import {ComponentType, useEffect, useRef} from 'react'

import {CommandMatch} from './commands'

export interface CommandListItemProps {
  match: CommandMatch
  selected: boolean
  onMouseEnter: () => void
  onSelect: () => void
}

const CommandListItem: ComponentType<CommandListItemProps> = (props) => {
  // Button renders as an <li> here, so the ref element type must match (styled-components/@sanity/ui v6 types this strictly).
  const ref = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (props.selected && ref.current) {
      ref.current.scrollIntoView({behavior: 'smooth', block: 'nearest'})
    }
  }, [props.selected])

  return (
    <Button
      as={'li'}
      ref={ref}
      onMouseEnter={props.onMouseEnter}
      onClick={props.onSelect}
      selected={props.selected}
      tone={props.selected ? 'primary' : 'default'}
      mode={'bleed'}
      width={'fill'}
      justify={'flex-start'}
      icon={props.match.icon}
      // A two-line label (title + description) makes the vertical list read as a
      // command palette rather than a row of icons.
      text={
        <Stack space={2}>
          <Text size={1} weight={'medium'} textOverflow={'ellipsis'}>
            {props.match.label}
          </Text>
          <Text size={0} muted textOverflow={'ellipsis'}>
            {props.match.description}
          </Text>
        </Stack>
      }
      role="option"
      aria-selected={props.selected}
      aria-label={props.match.label}
    />
  )
}
export default CommandListItem
