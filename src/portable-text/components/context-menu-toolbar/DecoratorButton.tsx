import {ToolbarDecoratorSchemaType, useDecoratorButton} from '@portabletext/toolbar'
import {Box, Button, Text, Tooltip} from '@sanity/ui'
import {ComponentType} from 'react'

/** Button component for toggling a text decorator (like bold or italic) in the Portable Text editor toolbar.
 *
 * @param decorator - `decorator`: {@link ToolbarDecoratorSchemaType} The schema definition for the decorator to be toggled.
 *
 * ## Usage
 * ```tsx
 *  // in PTE toolbar
 *  {toolbarSchema.decorators &&
 *    toolbarSchema.decorators?.map((decorator) => (
 *      <DecoratorButton key={decorator.name} decorator={decorator} />
 *  ))}
 * ```
 *
 */
const DecoratorButton: ComponentType<{decorator: ToolbarDecoratorSchemaType}> = ({decorator}) => {
  const decoratorButton = useDecoratorButton({schemaType: decorator})
  return (
    <Tooltip
      content={
        <Box padding={2}>
          <Text size={1}>{decorator.title}</Text>
        </Box>
      }
    >
      <Button
        key={decorator.name}
        onClick={() => decoratorButton.send({type: 'toggle'})}
        selected={decoratorButton.snapshot.matches({enabled: 'active'})}
        aria-pressed={decoratorButton.snapshot.matches({enabled: 'active'})}
        aria-label={decorator.title}
        disabled={decoratorButton.snapshot.matches('disabled')}
        icon={decorator.icon}
        as={'button'}
        padding={2}
        tone={'default'}
        mode={'bleed'}
        title={decorator.shortcut?.keys.join('+')}
      />
    </Tooltip>
  )
}
export default DecoratorButton
