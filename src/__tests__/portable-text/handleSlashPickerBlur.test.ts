import type {EditorEmittedEvent} from '@portabletext/editor'
import {describe, expect, it, vi} from 'vitest'

import {handleSlashPickerBlur} from '../../portable-text/pte-slash-commands/handleSlashPickerBlur'

describe('handleSlashPickerBlur', () => {
  it('dismisses the picker exactly once when the editor blurs', () => {
    const send = vi.fn()

    handleSlashPickerBlur({type: 'blurred'} as never, send)

    expect(send).toHaveBeenCalledTimes(1)
    expect(send).toHaveBeenCalledWith({type: 'dismiss'})
  })

  it('is a no-op for other editor events', () => {
    const send = vi.fn()

    handleSlashPickerBlur({type: 'focused'} as never, send)
    handleSlashPickerBlur({type: 'mutation'} as unknown as EditorEmittedEvent, send)

    expect(send).not.toHaveBeenCalled()
  })
})
