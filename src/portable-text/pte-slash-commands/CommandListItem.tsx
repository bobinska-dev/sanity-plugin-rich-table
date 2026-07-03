import {Button} from '@sanity/ui'
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
      mode={'bleed'}
      icon={props.match.icon}
      title={props.match.label}
      role="option"
      aria-selected={props.selected}
      aria-label={props.match.label}
    />
  )
}
export default CommandListItem
