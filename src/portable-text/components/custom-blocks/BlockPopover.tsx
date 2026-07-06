import {ToolbarBlockObjectSchemaType, useBlockObjectPopover} from '@portabletext/toolbar'
import {EditIcon, TrashIcon} from '@sanity/icons'
import {Box, Button, Flex, Popover, Stack, Text} from '@sanity/ui'
import {ComponentType} from 'react'
import {Path} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {usePopoverA11y} from '../usePopoverA11y'

const BlockPopover: ComponentType<{
  schemaTypes: readonly ToolbarBlockObjectSchemaType[]
  path: Path
  /** Editor focus state; the popover stays mounted while focus is within it. */
  focused: boolean
}> = (props) => {
  const blockObjectPopover = useBlockObjectPopover(props)

  const documentPane = useDocumentPane()
  const {focusWithin, contentProps} = usePopoverA11y()
  if (
    !focusWithin &&
    (!props.focused ||
      blockObjectPopover.snapshot.matches('disabled') ||
      blockObjectPopover.snapshot.matches({enabled: 'inactive'}))
  ) {
    return null
  }

  // Cast the ref's current value to HTMLElement | null to satisfy the Popover prop type
  const referenceEl = blockObjectPopover.snapshot.context.elementRef?.current as HTMLElement | null

  const blockObject = blockObjectPopover.snapshot.context.blockObjects.at(0)
  if (!blockObject) {
    return null
  }
  // get path to block
  const blockPath = props.path.concat(blockObject?.at)

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
        <Box
          {...contentProps}
          padding={3}
          role="dialog"
          aria-label="Block actions"
          onMouseDown={(e) => e.preventDefault()}
        >
          <Stack>
            <Flex justify={'space-between'} align={'center'} gap={3}>
              <Text size={1}>{blockObject?.schemaType.title}</Text>
              <Button
                icon={EditIcon}
                mode={'bleed'}
                fontSize={0}
                padding={0}
                title={`Edit ${blockObject.schemaType.title ?? 'block'}`}
                aria-label={`Edit ${blockObject.schemaType.title ?? 'block'}`}
                onClick={() => {
                  documentPane.onPathOpen(blockPath)
                }}
              />
              <Button
                icon={TrashIcon}
                mode={'bleed'}
                padding={0}
                fontSize={0}
                tone={'critical'}
                title={`Remove ${blockObject.schemaType.title ?? 'block'}`}
                aria-label={`Remove ${blockObject.schemaType.title ?? 'block'}`}
                onClick={() => {
                  blockObjectPopover.send({type: 'remove', at: blockObject.at})
                }}
              />
            </Flex>
          </Stack>
        </Box>
      }
    />
  )
}

export default BlockPopover
