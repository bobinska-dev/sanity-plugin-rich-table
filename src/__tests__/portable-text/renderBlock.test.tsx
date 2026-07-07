import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import type {ComponentProps} from 'react'
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

  it('routes a NAMED image member (imageWithCaption) to ImageBlock by base type', () => {
    // A named `type: 'image'` member — its compiled `.type` chain reaches
    // `image`, so it must get ImageBlock and not fall through to the default
    // block (which would render the asset object and crash).
    const configSchema = {
      of: [{name: 'imageWithCaption', type: {name: 'image', type: {name: 'object'}}}],
    } as never
    const RenderNamed = renderBlock({configSchema})
    const el = RenderNamed({
      schemaType: {name: 'imageWithCaption'},
      value: {_key: 'k'},
      children: null,
    } as never) as {type: unknown}
    expect(el.type).toBe(ImageBlock)
  })
})

describe('DefaultCustomBlock media fallback', () => {
  it('does not crash when preview media is an object (e.g. an image asset ref)', () => {
    const props = {
      schemaType: {
        name: 'imageWithCaption',
        title: 'Image with caption',
        preview: {select: {title: 'caption', media: 'asset'}},
      },
      value: {_key: 'k', caption: 'A caption', asset: {_type: 'reference', _ref: 'image-abc'}},
      selected: false,
      children: null,
    } as unknown as ComponentProps<typeof DefaultCustomBlock>

    expect(() =>
      render(
        <ThemeProvider theme={studioTheme}>
          <DefaultCustomBlock {...props} />
        </ThemeProvider>,
      ),
    ).not.toThrow()
    // The title still renders; the raw asset ref must NOT be dumped as a child.
    expect(screen.getByText('A caption')).toBeInTheDocument()
    expect(screen.queryByText(/image-abc/)).not.toBeInTheDocument()
  })
})
