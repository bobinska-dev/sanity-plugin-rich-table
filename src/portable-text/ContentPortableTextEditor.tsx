import {EditorConfig, EditorProvider, useEditor} from '@portabletext/editor'
import {ListIndexProvider} from '@portabletext/plugin-list-index'
import {MarkdownShortcutsPlugin} from '@portabletext/plugin-markdown-shortcuts'
import {PasteLinkPlugin} from '@portabletext/plugin-paste-link'
import {Card} from '@sanity/ui'
import {ComponentType, Suspense, useCallback, useEffect, useMemo, useRef, useState} from 'react'
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
import {resolveCellContentSchemaType} from './resolveCellContentSchemaType'
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

/**
 * Keeps the editor's `readOnly` in sync with the prop after mount. `initialConfig`
 * only seeds `readOnly` once, so a field that flips read-only later (conditional
 * `readOnly`, publish lock, release scheduling) would otherwise stay
 * keyboard-editable and write through the mutation→patch bridge even though the
 * toolbar is hidden. `update readOnly` is the editor's public external event.
 */
const SyncReadOnly: ComponentType<{readOnly: boolean}> = ({readOnly}) => {
  const editor = useEditor()
  useEffect(() => {
    editor.send({type: 'update readOnly', readOnly})
  }, [editor, readOnly])
  return null
}

/**
 * Sync EXTERNAL value changes into the editor. `initialConfig` only seeds the
 * value once, so without this a cell never reflects an undo/redo, a History-panel
 * revert, or a real-time collaborator's edit until it's remounted.
 *
 * The hard constraint is not clobbering the user's own typing. Local edits leave
 * the editor as a `mutation` event, get written by {@link CustomListenerPlugin}
 * via `patch.execute`, then round-trip back as a new `value` prop — re-entering
 * here. Pushing `update value` for that echo (or the naive `key={hash(value)}`
 * remount) would reset the value mid-keystroke: dropped characters, jumped caret.
 *
 * So we never sync while the cell is focused. `syncedValueRef` records the last
 * `value` the editor was reconciled to, and the effect re-runs on blur (`focused`
 * is a dependency), so an external change that arrived WHILE focused is flushed on
 * blur instead of being lost until some unrelated later change — the gap a plain
 * value-keyed effect leaves. Comparing against `syncedValueRef` (not the editor's
 * live snapshot) is what keeps this safe: if `value` is momentarily stale-behind a
 * just-typed keystroke on blur, it still equals `syncedValueRef`, so we DON'T push
 * a revert; when the local edit's patch round-trips, `value` changes and we sync to
 * it (a no-op the editor already has). Re-applying the user's own value is harmless
 * (they're not focused); only a genuinely external `value` produces a real change.
 */
export const SyncExternalValue: ComponentType<{
  value: PortableTextBlock[] | undefined
  focused: boolean
}> = ({value, focused}) => {
  const editor = useEditor()
  // The last value we reconciled the editor to. Seeded from the initial value
  // (already applied via `initialConfig`), so the first run is a no-op.
  const syncedValueRef = useRef(value)
  useEffect(() => {
    // The user is editing this cell — their edits are the source of truth and are
    // already being persisted; do not overwrite the live value under the caret.
    if (focused) return
    // Reference-compare against what we last synced: `value` is a slice of the
    // immutable document value, so a new reference means the content changed.
    if (value === syncedValueRef.current) return
    syncedValueRef.current = value
    editor.send({type: 'update value', value})
  }, [editor, value, focused])
  return null
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
  // Resolve the cell content schema from the cell's OWN `content` field first.
  // It is always correct — `defineCellObject` sets it to
  // `portableTextSchemaTypeName || 'content'` — and, crucially, it survives
  // Sanity dropping `components.input` on a RENAMED `richTableBlock` member,
  // where the threaded `portableTextSchemaTypeName` prop never arrives and the
  // cell would otherwise fall back to the default schema (SYS-192). The global
  // lookup by name stays as a defensive fallback.
  const configSchema =
    resolveCellContentSchemaType(props.schemaType) ??
    (props.portableTextSchemaTypeName
      ? (schema.get(props.portableTextSchemaTypeName) as
          | ArraySchemaType<PortableTextBlock>
          | undefined)
      : undefined)

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
  // `configSchema` (resolved from the cell's own content field, above) drives the
  // toolbar and slash-command picker too. It's the resolved `content` array type
  // even for the built-in default, so no separate fallback is needed.
  const pteSchemaType = configSchema

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
          <SyncReadOnly readOnly={props.readOnly ?? false} />
          <SyncExternalValue value={props.value} focused={focused} />
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
