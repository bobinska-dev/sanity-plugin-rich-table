import type {EditorEmittedEvent} from '@portabletext/editor'

/** Dismiss the typeahead picker when the editor loses focus; a no-op for any other event. */
export function handleSlashPickerBlur(
  event: EditorEmittedEvent,
  send: (action: {type: 'dismiss'}) => void,
): void {
  if (event.type === 'blurred') {
    send({type: 'dismiss'})
  }
}
