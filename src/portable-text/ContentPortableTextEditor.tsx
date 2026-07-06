import {EditorConfig, EditorProvider} from '@portabletext/editor'
import {ListIndexProvider} from '@portabletext/plugin-list-index'
import {MarkdownShortcutsPlugin} from '@portabletext/plugin-markdown-shortcuts'
import {PasteLinkPlugin} from '@portabletext/plugin-paste-link'
import {Card} from '@sanity/ui'
import {ComponentType, Suspense, useCallback, useMemo, useRef, useState} from 'react'
import {
  ArrayDefinition,
  ArraySchemaType,
  InputProps,
  PortableTextBlock,
  useFormValue,
  useSchema,
  type ValidationMarker,
} from 'sanity'

import LoadingIndicator from '../components/LoadingIndicator'
import {invalidAnnotationKeysFrom} from '../hooks/useTableCellValidation'
import content from '../schemas/content'
import ButtonToolbar from './components/context-menu-toolbar/ButtonToolbar'
import CustomListenerPlugin from './components/EventListenerPlugin'
import {StyledPortableTextEditable} from './components/StyledPortableTextEditable'
import {extractBlockConfig} from './configs/extractBlockConfig'
import {AnnotationComponent, createRenderAnnotation} from './configs/renderer/renderAnnotation'
import {renderBlock} from './configs/renderer/renderBlock'
import {createRenderChild, InlineObjectComponent} from './configs/renderer/renderChild'
import {createRenderDecorator, DecoratorComponent} from './configs/renderer/renderDecorators'
import {renderListItem} from './configs/renderer/renderListItem'
import {createRenderStyle, StyleComponent} from './configs/renderer/renderStyle'
import {EmojiPickerPlugin} from './emoji-picker/EmojiPicker'
import {InlineDiffEditable} from './inline-diff/InlineDiffEditable'
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
  schemaType?: ArraySchemaType<PortableTextBlock> | ArrayDefinition
  portableTextSchemaTypeName?: string
  /** When true (Studio "inline changes" mode, `?displayInlineChanges=true`),
   * overlay this cell's before→after diff on the live, still-editable editor.
   * Off during normal editing. */
  displayInlineChanges?: boolean
  /** Validation markers at or below this cell, aggregated from the document-wide
   * list. Cells stay space-tight: the marker messages/tooltip are surfaced once
   * at the rich-table level, and here these markers drive only the cell tone plus
   * red text on any annotation whose URL/field errors. */
  validation?: ValidationMarker[]
  /** Cell tone derived from the most severe marker (`critical` / `caution`). */
  validationTone?: 'critical' | 'caution'
  /** ARIA role for the rendered root (e.g. `"cell"` when used as a table cell). */
  role?: string
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

  const schema = useSchema()
  const configSchema = props.portableTextSchemaTypeName
    ? (schema.get(props.portableTextSchemaTypeName) as ArraySchemaType<PortableTextBlock>)
    : undefined

  // Consumer-defined custom render components for marks, keyed by name. They are
  // read off the compiled schema (styles/decorators carry `component`;
  // annotations carry `components.annotation`) so the renderers can prefer them
  // over the built-ins — the mark equivalent of a custom block's `tableBlock`.
  const markRenderers = useMemo(() => {
    const cfg = extractBlockConfig(configSchema)
    const styleComponents = new Map<string, StyleComponent>()
    const decoratorComponents = new Map<string, DecoratorComponent>()
    const annotationComponents = new Map<string, AnnotationComponent>()
    const inlineObjectComponents = new Map<string, InlineObjectComponent>()
    cfg?.styles.forEach((s) => s.component && styleComponents.set(s.name, s.component))
    cfg?.decorators.forEach((d) => d.component && decoratorComponents.set(d.name, d.component))
    cfg?.annotations.forEach((a) => a.component && annotationComponents.set(a.name, a.component))
    cfg?.inlineObjects.forEach(
      (o) => o.component && inlineObjectComponents.set(o.name, o.component),
    )
    return {
      renderStyle: createRenderStyle(styleComponents),
      renderDecorator: createRenderDecorator(decoratorComponents),
      // Kept as the raw map (not a built renderer) so `renderAnnotation` can be
      // rebuilt when the set of invalid annotations changes, without recreating
      // the other renderers.
      annotationComponents,
      renderChild: createRenderChild(inlineObjectComponents, configSchema),
    }
  }, [configSchema])

  // markDef keys with errors → red annotation text (recomputed as markers change).
  const invalidAnnotationKeys = useMemo(
    () => invalidAnnotationKeysFrom(props.validation ?? []),
    [props.validation],
  )

  // * INITIAL CONFIG FOR EDITOR PROVIDER
  // Split out to avoid a nested ternary. Prefer the schema resolved from
  // portableTextSchemaTypeName; else the passed-in schemaType's resolved array
  // type (legacy prop shape); else the built-in content type.
  const legacySchemaType = props.schemaType
    ? // @ts-expect-error legacy prop shape: unwrap the resolved array type
      props.schemaType.type.type
    : content
  const pteSchemaType = configSchema ? configSchema : legacySchemaType

  const initialConfig = useRef<EditorConfig>({
    initialValue: props.value,
    readOnly: props.readOnly ?? false,
    // editor v7 takes a SchemaDefinition (not a compiled schema). Convert the
    // schema resolved from `portableTextSchemaTypeName` (or fall back to defaults).
    schemaDefinition: resolveSchemaDefinition(configSchema),
  })

  // Render callbacks shared by the plain editable and the inline-diff overlay.
  const editableProps = useMemo(
    () => ({
      renderStyle: markRenderers.renderStyle,
      renderDecorator: markRenderers.renderDecorator,
      renderBlock: renderBlock({configSchema, path: props.path}),
      renderListItem,
      renderAnnotation: createRenderAnnotation(
        markRenderers.annotationComponents,
        invalidAnnotationKeys,
      ),
      renderChild: markRenderers.renderChild,
    }),
    [markRenderers, configSchema, invalidAnnotationKeys],
  )

  // TODO: fullscreen handling
  // const { getFullscreenPath, setFullscreenPath } = useFullscreenPTE()

  return (
    <Suspense fallback={<LoadingIndicator />}>
      <Card
        role={props.role}
        tone={props.validationTone ?? 'default'}
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
          <SlashCommandPickerPlugin schemaType={configSchema} />
          <PasteLinkPlugin />
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

          <ListIndexProvider>
            {props.displayInlineChanges ? (
              <InlineDiffEditable path={props.path} editableProps={editableProps} />
            ) : (
              <StyledPortableTextEditable {...editableProps} />
            )}
          </ListIndexProvider>
          {!props.readOnly && (
            <ButtonToolbar focused={focused} schemaType={pteSchemaType} path={props.path} />
          )}
        </EditorProvider>
      </Card>
    </Suspense>
  )
}

export default ContentPortableTextInput
