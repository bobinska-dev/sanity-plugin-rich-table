import {ToolbarListSchemaType, useListButton} from '@portabletext/toolbar'
import {Button} from '@sanity/ui'
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
      title={list.title}
    />
  )
}
export default ListButton
