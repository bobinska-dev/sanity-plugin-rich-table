import {describe, expect, it} from 'vitest'

import {portableTextToPlain} from '../utils/portableTextToPlain'

describe('portableTextToPlain', () => {
  it('returns an empty string for non-array input', () => {
    expect(portableTextToPlain(undefined)).toBe('')
    expect(portableTextToPlain(null)).toBe('')
    expect(portableTextToPlain('nope')).toBe('')
    expect(portableTextToPlain({})).toBe('')
  })

  it('concatenates span text within a block', () => {
    const blocks = [
      {
        _type: 'block',
        children: [
          {_type: 'span', text: 'Hello '},
          {_type: 'span', text: 'world'},
        ],
      },
    ]
    expect(portableTextToPlain(blocks)).toBe('Hello world')
  })

  it('joins multiple blocks with newlines', () => {
    const blocks = [
      {_type: 'block', children: [{_type: 'span', text: 'one'}]},
      {_type: 'block', children: [{_type: 'span', text: 'two'}]},
    ]
    expect(portableTextToPlain(blocks)).toBe('one\ntwo')
  })

  it('shows a placeholder for non-text members', () => {
    const blocks = [{_type: 'image', asset: {_ref: 'image-123'}}]
    expect(portableTextToPlain(blocks)).toBe('[image]')
  })

  it('never throws on malformed content', () => {
    const blocks = [null, 42, {_type: 'block'}, {_type: 'block', children: [null, {text: 5}]}]
    expect(() => portableTextToPlain(blocks)).not.toThrow()
    expect(portableTextToPlain(blocks)).toBe('')
  })
})
