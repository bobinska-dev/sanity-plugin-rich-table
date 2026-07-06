import {ToolbarAnnotationSchemaType, useAnnotationButton} from '@portabletext/toolbar'
import {Box, Button, Text, Tooltip} from '@sanity/ui'
import {ComponentType} from 'react'

/** Button component for toggling annotations in a rich text editor.
 *
 * @param annotation - `annotation`: {@link ToolbarAnnotationSchemaType} The annotation schema type defining the annotation.
 *
 * ## Usage
 * ```tsx
 * // in PTE toolbar
 *  {toolbarSchema.annotations?.map((annotation) => (
 *   <AnnotationButton key={annotation.name} annotation={annotation} />
 *  ))}
 * ```
 *
 */
const AnnotationButton: ComponentType<{annotation: ToolbarAnnotationSchemaType}> = ({
  annotation,
}) => {
  const annotationButton = useAnnotationButton({schemaType: annotation})
  return (
    <Tooltip
      content={
        <Box padding={2}>
          <Text size={1}>{annotation.title}</Text>
        </Box>
      }
    >
      <Button
        onClick={() =>
          annotationButton.snapshot.matches({enabled: 'active'})
            ? annotationButton.send({type: 'remove'})
            : annotationButton.send({
                type: 'add',
                annotation: {
                  value: annotation.name === 'link' ? {href: ''} : {},
                },
              })
        }
        selected={annotationButton.snapshot.matches({enabled: 'active'})}
        aria-pressed={annotationButton.snapshot.matches({enabled: 'active'})}
        aria-label={annotation.title}
        disabled={annotationButton.snapshot.matches('disabled')}
        aria-keyshortcuts={annotation.shortcut?.keys.join('+')}
        icon={annotation.icon}
        padding={2}
        mode={'bleed'}
        title={annotation.shortcut?.keys.join('+')}
      />
    </Tooltip>
  )
}
export default AnnotationButton
