import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

const {send} = vi.hoisted(() => ({send: vi.fn()}))
vi.mock('@portabletext/editor', () => ({useEditor: () => ({send})}))

import {usePopoverA11y} from '../../portable-text/components/usePopoverA11y'

/**
 * Mimics the real layout: an editable, then a portaled-style popover rendered
 * *after* it in the DOM (so a plain Tab from the editable would skip the popover
 * and land on whatever comes next — the bug the hook works around).
 */
function Harness() {
  const {contentProps} = usePopoverA11y()
  return (
    <div>
      <div contentEditable tabIndex={0} data-testid="editable" suppressContentEditableWarning />
      <button type="button" data-testid="outside">
        Toolbar button
      </button>
      <div {...contentProps} data-testid="popover">
        <button type="button" data-testid="edit">
          Edit
        </button>
        <button type="button" data-testid="remove">
          Remove
        </button>
      </div>
    </div>
  )
}

describe('usePopoverA11y', () => {
  it('moves focus into the popover when Tab is pressed from the editable', () => {
    render(<Harness />)
    const editable = screen.getByTestId('editable')
    editable.focus()
    expect(document.activeElement).toBe(editable)

    fireEvent.keyDown(document, {key: 'Tab'})

    // Lands on the first popover action, NOT the toolbar button that follows the
    // editable in DOM order.
    expect(document.activeElement).toBe(screen.getByTestId('edit'))
    expect(document.activeElement).not.toBe(screen.getByTestId('outside'))
  })

  it('cycles focus back to the first action when Tab is pressed on the last', () => {
    render(<Harness />)
    const remove = screen.getByTestId('remove')
    remove.focus()

    fireEvent.keyDown(remove, {key: 'Tab'})

    expect(document.activeElement).toBe(screen.getByTestId('edit'))
  })

  it('cycles focus to the last action on Shift+Tab from the first', () => {
    render(<Harness />)
    const edit = screen.getByTestId('edit')
    edit.focus()

    fireEvent.keyDown(edit, {key: 'Tab', shiftKey: true})

    expect(document.activeElement).toBe(screen.getByTestId('remove'))
  })

  it('returns focus to the editor on Escape', async () => {
    send.mockClear()
    render(<Harness />)
    const edit = screen.getByTestId('edit')
    edit.focus()

    fireEvent.keyDown(edit, {key: 'Escape'})

    await waitFor(() => expect(send).toHaveBeenCalledWith({type: 'focus'}))
  })

  it('does not hijack Tab when focus is outside any editable', () => {
    render(<Harness />)
    const outside = screen.getByTestId('outside')
    outside.focus()

    fireEvent.keyDown(document, {key: 'Tab'})

    // Focus is left alone (no editable → the hook ignores it).
    expect(document.activeElement).toBe(outside)
  })
})
