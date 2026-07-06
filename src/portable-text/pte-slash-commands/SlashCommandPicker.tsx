import {useEditor} from '@portabletext/editor'
import {effect, raise} from '@portabletext/editor/behaviors'
import {defineTypeaheadPicker, useTypeaheadPicker} from '@portabletext/plugin-typeahead-picker'
import {Box, Text} from '@sanity/ui'
import Fuse from 'fuse.js'
import {useMemo} from 'react'
import type {ArrayDefinition, ArraySchemaType, PortableTextBlock} from 'sanity'

import {FloatingPanel} from '../components/FloatingPanel'
import {extractBlockConfig} from '../configs/extractBlockConfig'
import CommandListBox from './CommandListBox'
import {buildSlashCommands, CommandMatch} from './commands'

interface SlashCommandPickerPluginProps {
  /** The cell's resolved PT array schema — supplies each command's schema-defined icon. */
  schemaType?: ArraySchemaType<PortableTextBlock> | ArrayDefinition
}

export function SlashCommandPickerPlugin({schemaType}: SlashCommandPickerPluginProps) {
  const editor = useEditor()

  // The toolbar's icon source; overlaid onto the schema-driven commands below so
  // the picker shows the same custom icons the toolbar does.
  const config = useMemo(
    () => extractBlockConfig(schemaType as ArraySchemaType<PortableTextBlock> | undefined),
    [schemaType],
  )

  // Build the command list from the cell's compiled PT schema so the picker
  // offers exactly what the schema allows — styles, decorators, lists, block
  // objects and inline objects, including any custom entries. The schema is
  // fixed for an editor instance, so this is computed once per editor.
  const commands = useMemo(
    () => buildSlashCommands(editor.getSnapshot().context.schema, config),
    [editor, config],
  )

  const picker = useMemo(() => {
    const fuse = new Fuse(commands, {
      keys: [
        {name: 'label', weight: 1.0},
        {name: 'keywords', weight: 0.8},
      ],
      threshold: 0.4,
      ignoreLocation: true,
    })

    return defineTypeaheadPicker<CommandMatch>({
      trigger: /^\//,
      keyword: /\w*/,
      getMatches: ({keyword}) =>
        keyword === '' ? commands : fuse.search(keyword).map((result) => result.item),
      onSelect: [
        ({event, snapshot}) => {
          // Every command first removes the typed `/keyword` trigger text.
          const deletePattern = [raise({type: 'delete', at: event.patternSelection})]
          const {action} = event.match

          switch (action.type) {
            case 'style.toggle':
              return [...deletePattern, raise({type: 'style.toggle', style: action.style})]
            case 'decorator.toggle':
              return [
                ...deletePattern,
                raise({type: 'decorator.toggle', decorator: action.decorator}),
              ]
            case 'list item.toggle':
              return [
                ...deletePattern,
                raise({type: 'list item.toggle', listItem: action.listItem}),
              ]
            case 'insert.inline object':
              return [
                ...deletePattern,
                raise({
                  type: 'insert.inline object',
                  inlineObject: {name: action.inlineObject.name},
                }),
              ]
            case 'insert.block':
              return [
                ...deletePattern,
                raise({
                  type: 'insert.block',
                  placement: 'auto',
                  block: {...action.block, _key: snapshot.context.keyGenerator()},
                }),
              ]
            default:
              return deletePattern
          }
        },
        // Keep focus in the editor after acting on the selection.
        () => [effect(({send}) => send({type: 'focus'}))],
      ],
    })
  }, [commands])

  const pickerState = useTypeaheadPicker(picker)
  const {keyword, matches, selectedIndex} = pickerState.snapshot.context
  const isActive = pickerState.snapshot.matches('active')

  const getAnchorRect = () => editor.dom.getSelectionRect(editor.getSnapshot())

  if (!isActive) return null

  return (
    <FloatingPanel getAnchorRect={getAnchorRect} offset={4}>
      <Box paddingBottom={2}>
        <Text size={0} muted style={{fontStyle: 'italic'}}>
          Insert a style, mark, list or block (navigate with ↑ ↓ and Enter)
        </Text>
      </Box>
      <CommandListBox
        keyword={keyword}
        matches={matches}
        selectedIndex={selectedIndex}
        onDismiss={() => pickerState.send({type: 'dismiss'})}
        onNavigateTo={(index) => pickerState.send({type: 'navigate to', index})}
        onSelect={() => pickerState.send({type: 'select'})}
      />
    </FloatingPanel>
  )
}
