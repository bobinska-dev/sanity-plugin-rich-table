import {EventListenerPlugin} from '@portabletext/editor/plugins'
import {ComponentType} from 'react'
import {getPublishedId, getVersionFromId, Path, pathToString, useDocumentOperation} from 'sanity'

const CustomListenerPlugin: ComponentType<{
  path: Path
  _id: string
  _type: string
  handleFocus: (state: boolean) => void
  // on: (event: EditorEmittedEvent) => void
}> = (props) => {
  const {_id, _type, handleFocus} = props
  // Pass the version/release id so patches target the edited perspective
  // (release version) instead of always writing to drafts. See SYS-138.
  const {patch} = useDocumentOperation(getPublishedId(_id), _type, getVersionFromId(_id))
  return (
    <EventListenerPlugin
      on={(event) => {
        if (event.type === 'focused') {
          handleFocus(true)
        }
        if (event.type === 'blurred') {
          handleFocus(false)
        }
        if (event.type === 'mutation') {
          // * HANDLE MUTATION EVENTS
          const preparedPatches = event.patches.map((eventPatch) => {
            if (eventPatch.type === 'unset') {
              return {
                unset: [pathToString([...props.path, ...eventPatch.path])],
              }
            }

            if (eventPatch.type === 'insert') {
              return {
                insert: {
                  [eventPatch.position]: pathToString([...props.path, ...eventPatch.path]),
                  items: eventPatch.items,
                },
              }
            }
            return {
              [eventPatch.type]: {
                [pathToString([...props.path, ...eventPatch.path])]: eventPatch.value,
              },
            }
          })
          patch.execute(preparedPatches)
          // props.onChange(preparedPatches) // THIS DOES NOT WORK, but TS errors are too weird for me to understand
        }

        // * HANDLE SELECTION EVENTS
        /*if (event.type === 'selection') {
          // show toolbar on selection change above the selection
          console.log('Selection changed:', event)
        }*/
      }}
    />
  )
}
export default CustomListenerPlugin
