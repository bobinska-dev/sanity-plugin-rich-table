import {useEditor} from '@portabletext/editor'
import type {ToolbarBlockObjectSchemaType} from '@portabletext/toolbar'
import {AddIcon} from '@sanity/icons'
import {Button, Menu, MenuItem, MenuButton, Text} from '@sanity/ui'
import {ComponentType} from 'react'

/** Individual menu item — sends insert directly to the editor */
const BlockObjectMenuItem: ComponentType<{
  blockObject: ToolbarBlockObjectSchemaType
}> = ({blockObject}) => {
  const editor = useEditor()

  const handleClick = () => {
    editor.send({
      type: 'insert.block object',
      blockObject: {
        name: blockObject.name,
        value: {},
      },
      placement: 'auto',
    })
    editor.send({type: 'focus'})
  }

  return (
    <MenuItem onClick={handleClick} padding={3}>
      <Text size={1}>{blockObject.title ?? blockObject.name}</Text>
    </MenuItem>
  )
}

/** "+" button that opens a dropdown menu of all available block objects */
const BlockObjectMenuButton: ComponentType<{
  blockObjects: ToolbarBlockObjectSchemaType[]
}> = ({blockObjects}) => {
  if (!blockObjects.length) return null

  return (
    <MenuButton
      id="block-object-menu"
      button={
        <Button
          fontSize={1}
          padding={2}
          mode="bleed"
          icon={AddIcon}
          aria-label="Insert block object"
        />
      }
      menu={
        <Menu>
          {blockObjects.map((bo) => (
            <BlockObjectMenuItem key={bo.name} blockObject={bo} />
          ))}
        </Menu>
      }
      popover={{portal: true, placement: 'bottom-start'}}
    />
  )
}

export default BlockObjectMenuButton
