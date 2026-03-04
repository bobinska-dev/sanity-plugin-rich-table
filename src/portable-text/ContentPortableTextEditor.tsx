import {EditorConfig, EditorProvider} from '@portabletext/editor'
import {MarkdownShortcutsPlugin} from '@portabletext/plugin-markdown-shortcuts'
import {Card} from '@sanity/ui'
import {ComponentType, Suspense, useCallback, useRef, useState} from 'react'
import {ArraySchemaType, InputProps, pathToString, PortableTextBlock, useFormValue} from 'sanity'

import LoadingIndicator from '../components/LoadingIndicator'
import ButtonToolbar from './components/context-menu-toolbar/ButtonToolbar'
import CustomListenerPlugin from './components/EventListenerPlugin'
import {LinkPlugin} from './components/LinkPlugin'
import {StyledPortableTextEditable} from './components/StyledPortableTextEditable'
import {renderAnnotation} from './configs/renderer/renderAnnotation'
import {renderBlock} from './configs/renderer/renderBlock'
import renderDecorator from './configs/renderer/renderDecorators'
import {renderListItem} from './configs/renderer/renderListItem'
import renderStyle from './configs/renderer/renderStyle'
import {EmojiPickerPlugin} from './emoji-picker/EmojiPicker'
import {SlashCommandPickerPlugin} from './pte-slash-commands/SlashCommandPicker'
import {resolveSchemaDefinition} from './resolveSchemaDefinition'

// import { useFullscreenPTE } from './hooks/useFullScreenPTE'

interface ContentPortableTextInputProps {
  /** used for initial value */
  value: PortableTextBlock[] | undefined
  /** The path is used in the onChange Handler - so it can be relative and absolute ? */ // TODO find this out
  path: InputProps['path']
  /** should be synced to the original fields readOnly */
  readOnly?: InputProps['readOnly']
  /** onChange handler */
  onChange: InputProps['onChange']
  /** pass down the resolved richText ArraySchemaType of your choice.
   * When omitted, standard PTE defaults are used (bold, italic, headings, lists, etc.)
   */
  schemaType?: ArraySchemaType<PortableTextBlock>
}

/** # ContentPortableTextInput
 * A Portable Text Input component for the rich table solution.
 */
const ContentPortableTextInput: ComponentType<ContentPortableTextInputProps> = (props) => {
  // * MISC
  const _id = useFormValue(['_id']) as string
  const _type = useFormValue(['_type']) as string
  // STATES
  const [focused, setFocused] = useState<boolean>(false)

  const handleFocus = useCallback((state: boolean) => setFocused(state), [])
  // * INITIAL CONFIG FOR EDITOR PROVIDER
  const initialConfig = useRef<EditorConfig>({
    initialValue: props.value,
    readOnly: props.readOnly ?? false,
    schemaDefinition: resolveSchemaDefinition(props.schemaType),
  })

  // TODO: fullscreen handling
  // const { getFullscreenPath, setFullscreenPath } = useFullscreenPTE()

  return (
    <Suspense fallback={<LoadingIndicator />}>
      <Card
        tone={'default'}
        id={`portable-text-${pathToString(props.path)}`}
        border
        style={{position: 'relative'}}
      >
        {/* eslint-disable-next-line react-hooks/refs */}
        <EditorProvider initialConfig={initialConfig.current}>
          <CustomListenerPlugin
            _id={_id}
            _type={_type}
            path={props.path}
            handleFocus={handleFocus}
          />
          <SlashCommandPickerPlugin />
          <LinkPlugin />
          <EmojiPickerPlugin />
          <MarkdownShortcutsPlugin
            boldDecorator={({context}) =>
              context.schema.decorators.find((d) => d.name === 'strong')?.name
            }
            codeDecorator={({context}) =>
              context.schema.decorators.find((d) => d.name === 'code')?.name
            }
            italicDecorator={({context}) =>
              context.schema.decorators.find((d) => d.name === 'em')?.name
            }
            strikeThroughDecorator={({context}) =>
              context.schema.decorators.find((d) => d.name === 'strike-through')?.name
            }
            defaultStyle={({context}) =>
              context.schema.styles.find((s) => s.name === 'normal')?.name
            }
            headingStyle={({context, props: {level}}) =>
              context.schema.styles.find((s) => s.name === `h${level}`)?.name
            }
            blockquoteStyle={({context}) =>
              context.schema.styles.find((s) => s.name === 'blockquote')?.name
            }
            orderedList={({context}) => context.schema.lists.find((s) => s.name === 'number')?.name}
            unorderedList={({context}) =>
              context.schema.lists.find((s) => s.name === 'bullet')?.name
            }
            horizontalRuleObject={({context}) => {
              const schemaType = context.schema.blockObjects.find(
                (object) => object.name === 'break',
              )

              if (!schemaType) {
                return undefined
              }

              return {_type: schemaType.name}
            }}
            linkObject={({context, props: linkProps}) => {
              const schemaType = context.schema.annotations.find(
                (annotation) => annotation.name === 'link',
              )
              const hrefField = schemaType?.fields.find(
                (field) => field.name === 'href' && field.type === 'string',
              )

              if (!schemaType || !hrefField) {
                return undefined
              }

              return {
                _type: schemaType.name,
                [hrefField.name]: linkProps.href,
              }
            }}
          />

          <StyledPortableTextEditable
            renderStyle={renderStyle}
            renderDecorator={renderDecorator}
            renderBlock={renderBlock}
            renderListItem={renderListItem}
            renderAnnotation={renderAnnotation}
          />
          {!props.readOnly && <ButtonToolbar focused={focused} editorRef={initialConfig} />}
        </EditorProvider>
      </Card>
    </Suspense>
  )
}

export default ContentPortableTextInput
