import {ToolbarInlineObjectSchemaType, useInlineObjectPopover} from '@portabletext/toolbar'
import {EditIcon, TrashIcon} from '@sanity/icons'
import {Box, Button, Flex, Popover, Stack, Text} from '@sanity/ui'
import {ComponentType} from 'react'
import {Path} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

/**
 * Popover for the selected inline object, with edit/remove. Editing opens the
 * inline object in Sanity's NATIVE document form via
 * `useDocumentPane().onPathOpen` — the same mechanism {@link BlockPopover} uses
 * for block objects. Inline objects need no table-specific handling; they are
 * ordinary members of the cell's Portable Text value.
 */
const InlineObjectPopover: ComponentType<{
  schemaTypes: readonly ToolbarInlineObjectSchemaType[]
  path: Path
}> = (props) => {
  const inlineObjectPopover = useInlineObjectPopover(props)
  const documentPane = useDocumentPane()

  if (
    inlineObjectPopover.snapshot.matches('disabled') ||
    inlineObjectPopover.snapshot.matches({enabled: 'inactive'})
  ) {
    return null
  }

  // Cast the ref's current value to HTMLElement | null to satisfy the Popover prop type
  const referenceEl = inlineObjectPopover.snapshot.context.elementRef?.current as HTMLElement | null

  const inlineObject = inlineObjectPopover.snapshot.context.inlineObjects.at(0)
  if (!inlineObject) {
    return null
  }

  return (
    <Popover
      arrow
      open
      referenceElement={referenceEl}
      floatingBoundary={referenceEl}
      placement={'top'}
      preventOverflow={false}
      content={
        // Keep the editor focused when interacting with the popover, otherwise the
        // focused-gate in ButtonToolbar would unmount it before the buttons fire.
        <Box padding={3} onMouseDown={(e) => e.preventDefault()}>
          <Stack>
            <Flex justify={'space-between'} align={'center'} gap={3}>
              <Text size={1}>{inlineObject.schemaType.title}</Text>
              <Button
                icon={EditIcon}
                mode={'bleed'}
                fontSize={0}
                padding={2}
                title={`Edit ${inlineObject.schemaType.title}`}
                onClick={() => documentPane.onPathOpen(props.path.concat(inlineObject.at))}
              />
              <Button
                icon={TrashIcon}
                mode={'bleed'}
                fontSize={0}
                padding={2}
                tone={'critical'}
                title={`Remove ${inlineObject.schemaType.title}`}
                onClick={() => inlineObjectPopover.send({type: 'remove', at: inlineObject.at})}
              />
            </Flex>
          </Stack>
        </Box>
      }
    />
  )
}

export default InlineObjectPopover
