import {describe, expect, it} from 'vitest'

import DefaultCustomBlock from '../../portable-text/components/custom-blocks/DefaultCustomBlock'
import ImageBlock from '../../portable-text/components/custom-blocks/ImageBlock'
import ReferenceBlock from '../../portable-text/components/custom-blocks/ReferenceBlock'
import {renderBlock} from '../../portable-text/configs/renderer/renderBlock'

// renderBlock returns a React element WITHOUT rendering it (createElement doesn't
// invoke the component), so the dispatched fallback is asserted via the element's
// `type` — no Studio context / hooks needed. Called with no base path, so there's
// no BlockEditWrapper wrapper around the returned component.
describe('renderBlock dispatch', () => {
  const RenderBlock = renderBlock()
  const dispatch = (name: string, extra: Record<string, unknown> = {}) =>
    RenderBlock({
      schemaType: {name},
      value: {_key: 'k'},
      children: null,
      ...extra,
    } as never) as {type: unknown}

  it('dispatches an image block to ImageBlock', () => {
    expect(dispatch('image').type).toBe(ImageBlock)
  })

  it('dispatches a reference to ReferenceBlock', () => {
    expect(dispatch('reference').type).toBe(ReferenceBlock)
  })

  it('dispatches a generic object to DefaultCustomBlock', () => {
    expect(dispatch('callout').type).toBe(DefaultCustomBlock)
  })

  it('renders a text block as a plain div passthrough', () => {
    expect(dispatch('block').type).toBe('div')
  })
})
