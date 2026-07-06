import {ToolbarListSchemaType, useListButton} from '@portabletext/toolbar'
import {Box, Button, Text, Tooltip} from '@sanity/ui'
import {ComponentType} from 'react'

/** Button component for toggling list styles in a rich text editor.
 *
 * @param list - `list`: {@link ToolbarListSchemaType} The list schema type defining the list style.
 *
 * ## Usage
 * ```tsx
 *  // in PTE toolbar
 *  {toolbarSchema.lists?.map((list) => (
 *    <ListButton key={list.name} list={list} />
 *  ))}
 * ```
 */
const ListButton: ComponentType<{list: ToolbarListSchemaType}> = ({list}) => {
  const listButton = useListButton({schemaType: list})

  return (
    <Tooltip
      content={
        <Box padding={2}>
          <Text size={1}>{list.title}</Text>
        </Box>
      }
    >
      <Button
        key={list.name}
        onClick={() => listButton.send({type: 'toggle'})}
        selected={listButton.snapshot.matches({enabled: 'active'})}
        icon={list.icon}
        padding={2}
        tone={'default'}
        mode={'bleed'}
        aria-pressed={listButton.snapshot.matches({enabled: 'active'})}
        disabled={listButton.snapshot.matches('disabled')}
        aria-label={list.title}
      />
    </Tooltip>
  )
}
export default ListButton
