import {EmojiMatch} from '@portabletext/plugin-emoji-picker'
import {Button} from '@sanity/ui'
import {ComponentType, useEffect, useRef} from 'react'

interface EmojiListItemProps {
  match: EmojiMatch
  selected: boolean
  onMouseEnter: () => void
  onSelect: () => void
}

const EmojiListItem: ComponentType<EmojiListItemProps> = (props) => {
  const {match, selected, onMouseEnter, onSelect} = props
  // Button renders as an <li> here, so the ref element type must match (styled-components/@sanity/ui v6 types this strictly).
  const ref = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (selected && ref.current) {
      ref.current.scrollIntoView({behavior: 'smooth', block: 'nearest'})
    }
  }, [selected])
  return (
    <Button
      as={'li'}
      ref={ref}
      onMouseEnter={onMouseEnter}
      onClick={onSelect}
      selected={selected}
      mode={'bleed'}
      text={match.emoji}
      title={match.keyword}
    />
  )
}
export default EmojiListItem
