import {type EditorSelection, useEditor} from '@portabletext/editor'
import {defineBehavior, effect, raise} from '@portabletext/editor/behaviors'
import {defineTypeaheadPicker, useTypeaheadPicker} from '@portabletext/plugin-typeahead-picker'
import type {ToolbarBlockObjectSchemaType} from '@portabletext/toolbar'
import {Box, Dialog, Text} from '@sanity/ui'
import Fuse from 'fuse.js'
import {useEffect, useState} from 'react'

import {FloatingPanel} from '../components/FloatingPanel'
//import { InsertBlockObjectForm } from './toolbar/form.insert-block-object'
import {extendBlockObject} from '../configs/extendBlockObject'
import CommandListBox from './CommandListBox'
import {CommandMatch, slashCommands} from './commands'

type BlockObjectDialogState = {
  patternSelection: NonNullable<EditorSelection>
  schema: ToolbarBlockObjectSchemaType
}

type OpenBlockObjectDialogEvent = {
  type: 'custom.slash-command.open-block-object-dialog'
} & BlockObjectDialogState

const commandsFuse = new Fuse(slashCommands, {
  keys: [
    {name: 'label', weight: 1.0},
    {name: 'keywords', weight: 0.8},
  ],
  threshold: 0.4,
  ignoreLocation: true,
})

function matchCommands({keyword}: {keyword: string}): CommandMatch[] {
  if (keyword === '') {
    return slashCommands
  }

  return commandsFuse.search(keyword).map((result) => result.item)
}

const slashCommandPicker = defineTypeaheadPicker<CommandMatch>({
  trigger: /^\//,
  keyword: /\w*/,
  getMatches: matchCommands,
  onSelect: [
    ({event, snapshot}) => {
      const deletePattern = [raise({type: 'delete', at: event.patternSelection})]

      if (event.match.action.type === 'insert.block') {
        const blockType = event.match.action.block._type
        const blockObjectSchema = snapshot.context.schema.blockObjects.find(
          (blockObject) => blockObject.name === blockType,
        )

        if (blockObjectSchema && blockObjectSchema.fields.length > 0) {
          const extendedSchema = extendBlockObject(blockObjectSchema)

          return [
            effect(({send}) => {
              send({
                type: 'custom.slash-command.open-block-object-dialog',
                patternSelection: event.patternSelection,
                schema: extendedSchema,
              })
            }),
          ]
        }

        return [
          ...deletePattern,
          raise({
            type: 'insert.block',
            placement: 'auto',
            block: {
              ...event.match.action.block,
              _key: snapshot.context.keyGenerator(),
            },
          }),
        ]
      }

      if (event.match.action.type === 'style.toggle') {
        return [...deletePattern, raise({type: 'style.toggle', style: event.match.action.style})]
      }

      if (event.match.action.type === 'list item.toggle') {
        return [
          ...deletePattern,
          raise({
            type: 'list item.toggle',
            listItem: event.match.action.listItem,
          }),
        ]
      }

      return deletePattern
    },
    () => [
      effect(({send}) => {
        send({type: 'focus'})
      }),
    ],
  ],
})

export function SlashCommandPickerPlugin() {
  const editor = useEditor()
  const picker = useTypeaheadPicker(slashCommandPicker)
  const {keyword, matches, selectedIndex} = picker.snapshot.context

  const [blockObjectDialogState, setBlockObjectDialogState] =
    useState<BlockObjectDialogState | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    return editor.registerBehavior({
      behavior: defineBehavior<OpenBlockObjectDialogEvent, OpenBlockObjectDialogEvent['type']>({
        on: 'custom.slash-command.open-block-object-dialog',
        actions: [
          ({event}) => [
            effect(() => {
              setBlockObjectDialogState({
                patternSelection: event.patternSelection,
                schema: event.schema,
              })
            }),
          ],
        ],
      }),
    })
  }, [editor])

  const onDismiss = () => picker.send({type: 'dismiss'})
  const onNavigateTo = (index: number) => picker.send({type: 'navigate to', index})
  const onSelect = () => picker.send({type: 'select'})

  const isActive = picker.snapshot.matches('active')

  const getAnchorRect = () => editor.dom.getSelectionRect(editor.getSnapshot())

  const handleDialogCancel = () => {
    setOpen(false)
    if (blockObjectDialogState) {
      const {focus} = blockObjectDialogState.patternSelection
      editor.send({type: 'select', at: {anchor: focus, focus}})
      editor.send({type: 'focus'})
      setBlockObjectDialogState(null)
    }
  }

  /*  const handleDialogSubmit = ({
    value,
    placement,
  }: {
    value: { [key: string]: unknown }
    placement?: 'auto' | 'before' | 'after'
  }) => {
    if (blockObjectDialogState) {
      editor.send({
        type: 'delete',
        at: blockObjectDialogState.patternSelection,
      })
      editor.send({
        type: 'insert.block',
        block: {
          _type: blockObjectDialogState.schema.name,
          _key: editor.getSnapshot().context.keyGenerator(),
          ...value,
        },
        placement: placement ?? 'auto',
        select: 'end',
      })
      editor.send({ type: 'focus' })
      setBlockObjectDialogState(null)
    }
  }*/

  const blockObjectDialog = (
    <Dialog
      id={'slash-command-insert-block-object-dialog'}
      title={blockObjectDialogState?.schema.title ?? 'Insert Block'}
      onClose={handleDialogCancel}
      open={open}
    >
      {blockObjectDialogState && (
        <Box>
          <Text>hello</Text>
        </Box>
        /*<InsertBlockObjectForm
          fields={blockObjectDialogState.schema.fields}
          defaultValues={blockObjectDialogState.schema.defaultValues ?? {}}
          onSubmit={handleDialogSubmit}
        />*/
      )}
    </Dialog>
  )

  return (
    <>
      {open && blockObjectDialog}
      {isActive && (
        <FloatingPanel getAnchorRect={getAnchorRect} offset={4}>
          <Box paddingBottom={2}>
            <Text size={0} muted style={{fontStyle: 'italic'}}>
              Select your style, list or custom block (navigate with ↑ ↓ and Enter)
            </Text>
          </Box>
          <CommandListBox
            keyword={keyword}
            matches={matches}
            selectedIndex={selectedIndex}
            onDismiss={onDismiss}
            onNavigateTo={onNavigateTo}
            onSelect={onSelect}
          />
        </FloatingPanel>
      )}
    </>
  )
}
