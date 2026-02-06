import {defineArrayMember, defineType, ObjectInputProps} from 'sanity'
import {RichTablePluginOptions} from '../index'
import {CloseIcon} from '@sanity/icons'
import {Button, Flex, Stack} from '@sanity/ui'
import {useDocumentPane} from 'sanity/structure'

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

export const defineContentArrayMember = ({
  customBlockTypes,
  customInlineBlockTypes,
}: {
  customBlockTypes?: RichTablePluginOptions['customBlockTypes']
  customInlineBlockTypes?: RichTablePluginOptions['customBlockTypes']

}) => {
  // TODO: check status of icon bug: https://linear.app/sanity/issue/CRX-1894/usetoolbarschema-or-toolbarschema-icons-stripped-from-schema
  const blockTypes = customBlockTypes ? customBlockTypes : []
  const customBlockMembers = blockTypes.map((blockType) =>
    defineArrayMember({...(blockType.type as any), icon: blockType.icon, components: {
      ...blockType.type.components,
      input: (props:ObjectInputProps) => {
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
      }}}),
  )

  const inlineBlockTypes = customInlineBlockTypes ? customInlineBlockTypes : []
  const customInlineBlockMembers = inlineBlockTypes.map((inlineBlockType) =>
    defineArrayMember({...(inlineBlockType.type as any), icon: inlineBlockType.icon}),
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
