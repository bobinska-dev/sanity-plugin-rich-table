import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import {type ComponentProps, type ReactNode} from 'react'
import {describe, expect, it, vi} from 'vitest'

// ImageBlock calls useClient; stub it so the fallback renders outside a Studio.
// `useClient` is the only runtime import ImageBlock uses from 'sanity'.
vi.mock('sanity', () => ({
  useClient: () => ({withConfig: () => ({})}),
}))

import ImageBlock from '../../../portable-text/components/custom-blocks/ImageBlock'

const wrapper = ({children}: {children: ReactNode}) => (
  <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
)

describe('ImageBlock fallback', () => {
  it('renders a placeholder without crashing for an image that has no asset', () => {
    // @sanity/image-url throws "Unable to resolve image URL from source" for an
    // asset-less value, so the component must guard and skip the URL builder
    // rather than blow up an image block that hasn't been uploaded yet.
    // Only the fields ImageBlock reads are set; cast to the component's props.
    const props = {
      value: {_type: 'image', _key: 'k1'},
      schemaType: {title: 'Image'},
      selected: false,
    } as unknown as ComponentProps<typeof ImageBlock>

    expect(() => render(<ImageBlock {...props} />, {wrapper})).not.toThrow()
    expect(screen.getByText('No image selected')).toBeInTheDocument()
  })
})
