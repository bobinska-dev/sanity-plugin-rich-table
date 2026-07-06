import {CloseIcon} from '@sanity/icons'
import {Button, Flex, Stack} from '@sanity/ui'
import {defineArrayMember, defineType, ObjectDefinition, ObjectInputProps} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {RichTablePluginOptions} from '../index'

/**
 * Sanity schema type for table cell content.
 *
 * This registers the `content` array type in Sanity's schema system. Sanity
 * fills in default decorators, styles, and lists during its own compilation
 * pipeline, but the raw object exported here does NOT contain them.
 *
 * The standalone PTE in {@link ../portable-text/ContentPortableTextEditor.tsx}
 * reads the compiled schema type via `useSchema()`, so it receives those same
 * Sanity-provided defaults in the format expected by `@portabletext/editor`.
 */
export default defineType({
  name: 'content',
  title: 'Rich table content',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
    }),
  ],
})

/**
 * Wraps a custom block's default input with a "Close" button that returns focus
 * to the parent rich table. Defined as a named component (not a lowercase
 * `input` factory) so React's rules-of-hooks recognises the `useDocumentPane` call.
 */
function CustomBlockInput(props: ObjectInputProps) {
  const documentPane = useDocumentPane()
  const getRichTablePath = () => {
    const currentPath = props.path
    const rowsIndex = currentPath.findIndex((segment) => segment === 'rows')
    // remove all segments after and including rows, which will never be the first or last item
    return currentPath.slice(0, rowsIndex)
  }

  return (
    <Stack space={3}>
      {props.renderDefault(props)}
      <Flex justify={'flex-end'} padding={2}>
        <Button
          onClick={() => documentPane.onPathOpen(getRichTablePath())}
          icon={CloseIcon}
          text={'Close'}
          mode={'default'}
        />
      </Flex>
    </Stack>
  )
}

export const defineContentArrayMember = ({
  customBlockTypes,
  customInlineBlockTypes,
}: {
  customBlockTypes?: RichTablePluginOptions['customBlockTypes']
  customInlineBlockTypes?: RichTablePluginOptions['customBlockTypes']
}) => {
  const blockTypes = customBlockTypes ? customBlockTypes : []
  const customBlockMembers = blockTypes.map((blockType) => {
    // Collapse the ObjectDefinition | ImageDefinition | ReferenceDefinition union to a single
    // object-definition shape. All three are object-like custom blocks, and spreading the raw
    // union alongside the injected generic `input` component otherwise trips union-variance on
    // `components` (e.g. ReferenceComponents.field doesn't unify with ObjectComponents.field).
    const blockDefinition = blockType.type as ObjectDefinition
    return defineArrayMember({
      ...blockDefinition,
      icon: blockType.icon,
      components: {
        ...blockDefinition.components,
        input: CustomBlockInput,
      },
    })
  })

  const inlineBlockTypes = customInlineBlockTypes ? customInlineBlockTypes : []
  const customInlineBlockMembers = inlineBlockTypes.map((inlineBlockType) =>
    defineArrayMember({...inlineBlockType.type, icon: inlineBlockType.icon}),
  )

  return defineArrayMember({
    name: 'content',
    title: 'Rich table content',
    type: 'array',
    of: [
      defineArrayMember({
        type: 'block',
        of: customInlineBlockMembers,
      }),
      ...customBlockMembers,
    ],
  })
}
