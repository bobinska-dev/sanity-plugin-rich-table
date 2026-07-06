import {ToolbarAnnotationSchemaType, useAnnotationPopover} from '@portabletext/toolbar'
import {EditIcon, TrashIcon} from '@sanity/icons'
import {Box, Button, Flex, Popover, Stack, Text} from '@sanity/ui'
import {ComponentType} from 'react'
import {Path} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {usePopoverA11y} from '../usePopoverA11y'

/** Popover listing the annotations on the current selection, with edit/remove.
 *
 * @param props - `schemaTypes`: {@link ToolbarAnnotationSchemaType} the annotation
 * schema types available in the editor; `path`: the document-root path to this
 * cell's Portable Text array.
 *
 * ## Usage
 * ```tsx
 *   // in the PTE toolbar
 *   {toolbarSchema.annotations && (
 *     <AnnotationPopover schemaTypes={toolbarSchema.annotations} path={path} />
 *   )}
 * ```
 *
 * Editing opens the annotation's markDef in Sanity's NATIVE document form via
 * `useDocumentPane().onPathOpen` — the same mechanism custom blocks use
 * ({@link ../custom-blocks/BlockPopover}) — instead of a hand-rolled dialog.
 */
const AnnotationPopover: ComponentType<{
  schemaTypes: ReadonlyArray<ToolbarAnnotationSchemaType>
  path: Path
}> = (props) => {
  const annotationPopover = useAnnotationPopover(props)
  const documentPane = useDocumentPane()
  const {focusWithin, contentProps} = usePopoverA11y()

  // Stay mounted while focus is inside the popover, so a keyboard user can Tab to
  // the edit/remove actions without the machine's blur collapsing it.
  if (
    !focusWithin &&
    (annotationPopover.snapshot.matches('disabled') ||
      annotationPopover.snapshot.matches({enabled: 'inactive'}))
  ) {
    return null
  }
  // Cast the ref's current value to HTMLElement | null to satisfy the Popover prop type
  const referenceEl = annotationPopover.snapshot.context.elementRef?.current as HTMLElement | null

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
          aria-label="Annotation actions"
          onMouseDown={(e) => e.preventDefault()}
        >
          <Stack space={3}>
            {annotationPopover.snapshot.context.annotations.map((annotation) => (
              <Flex key={annotation.value._key} justify={'space-between'} align={'center'} gap={3}>
                <Text size={1}>{annotation.schemaType.title}</Text>
                <Flex gap={1}>
                  <Button
                    icon={EditIcon}
                    mode={'bleed'}
                    fontSize={0}
                    padding={2}
                    title={`Edit ${annotation.schemaType.title}`}
                    aria-label={`Edit ${annotation.schemaType.title}`}
                    onClick={() => documentPane.onPathOpen(props.path.concat(annotation.at))}
                  />
                  <Button
                    icon={TrashIcon}
                    mode={'bleed'}
                    fontSize={0}
                    padding={2}
                    tone={'critical'}
                    title={`Remove ${annotation.schemaType.title}`}
                    aria-label={`Remove ${annotation.schemaType.title}`}
                    onClick={() =>
                      annotationPopover.send({
                        type: 'remove',
                        schemaType: annotation.schemaType,
                      })
                    }
                  />
                </Flex>
              </Flex>
            ))}
          </Stack>
        </Box>
      }
    />
  )
}
export default AnnotationPopover
