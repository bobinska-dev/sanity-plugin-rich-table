import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import type {ReactNode} from 'react'
import {
  ArraySchemaType,
  BlockAnnotationProps,
  BlockDecoratorProps,
  BlockStyleProps,
  createSchema,
  PortableTextBlock,
} from 'sanity'
import {describe, expect, it} from 'vitest'

import {extractBlockConfig} from '../../../portable-text/configs/extractBlockConfig'
import {createRenderAnnotation} from '../../../portable-text/configs/renderer/renderAnnotation'
import {createRenderDecorator} from '../../../portable-text/configs/renderer/renderDecorators'
import {createRenderStyle} from '../../../portable-text/configs/renderer/renderStyle'

// Custom style/decorator components use Sanity's native block-component props;
// the plugin adapts its editor props to that shape (incl. `renderDefault`).
const LeadStyle = (props: BlockStyleProps) => (
  <div data-testid="lead" data-has-render-default={typeof props.renderDefault === 'function'}>
    {props.children}
  </div>
)
const HighlightDecorator = (props: BlockDecoratorProps) => (
  <mark data-testid="highlight" data-title={props.title}>
    {props.children}
  </mark>
)
// Custom annotation components use Sanity's native `BlockAnnotationProps`.
const LinkAnnotation = (props: BlockAnnotationProps) => <a data-testid="link">{props.children}</a>
const FootnoteAnnotation = (props: BlockAnnotationProps) => (
  <span data-testid="footnote">{props.children}</span>
)

// A `customPT`-shaped block schema mirroring the studio demo: styles/decorators
// use Sanity's native `component`; annotations use Sanity's native `components.annotation`.
const schema = createSchema({
  name: 'test',
  types: [
    {
      name: 'customPT',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'Lead', value: 'lead', component: LeadStyle},
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Highlight', value: 'highlight', component: HighlightDecorator},
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                fields: [{name: 'href', type: 'url', title: 'URL'}],
                components: {annotation: LinkAnnotation},
              },
              {
                name: 'footnote',
                type: 'object',
                title: 'Footnote',
                fields: [{name: 'text', type: 'string', title: 'Note'}],
                components: {annotation: FootnoteAnnotation},
              },
            ],
          },
        },
      ],
    },
  ],
})

const customPT = schema.get('customPT') as ArraySchemaType<PortableTextBlock>
const wrapper = ({children}: {children: ReactNode}) => (
  <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
)

describe('extractBlockConfig — custom mark components', () => {
  const cfg = extractBlockConfig(customPT)

  it('extracts the native style `component`', () => {
    expect(cfg?.styles.find((s) => s.name === 'lead')?.component).toBe(LeadStyle)
    expect(cfg?.styles.find((s) => s.name === 'normal')?.component).toBeUndefined()
  })

  it('extracts the native decorator `component`', () => {
    expect(cfg?.decorators.find((d) => d.name === 'highlight')?.component).toBe(HighlightDecorator)
    expect(cfg?.decorators.find((d) => d.name === 'strong')?.component).toBeUndefined()
  })

  it('extracts the annotation `components.annotation`', () => {
    expect(cfg?.annotations.find((a) => a.name === 'link')?.component).toBe(LinkAnnotation)
    expect(cfg?.annotations.find((a) => a.name === 'footnote')?.component).toBe(FootnoteAnnotation)
  })
})

describe('render factories — prefer custom components, fall back to built-ins', () => {
  const cfg = extractBlockConfig(customPT)
  const styleMap = new Map(
    cfg!.styles.filter((s) => s.component).map((s) => [s.name, s.component!]),
  )
  const decoratorMap = new Map(
    cfg!.decorators.filter((d) => d.component).map((d) => [d.name, d.component!]),
  )
  const annotationMap = new Map(
    cfg!.annotations.filter((a) => a.component).map((a) => [a.name, a.component!]),
  )

  it('renders the custom style for `lead` (adapted, with renderDefault), built-in for others', () => {
    const renderStyle = createRenderStyle(styleMap)
    render(
      renderStyle({schemaType: {value: 'lead', title: 'Lead'}, children: 'Lead text'} as never),
      {wrapper},
    )
    const lead = screen.getByTestId('lead')
    expect(lead).toHaveTextContent('Lead text')
    // The plugin adapts editor props → BlockStyleProps, incl. a `renderDefault`.
    expect(lead).toHaveAttribute('data-has-render-default', 'true')

    render(renderStyle({schemaType: {value: 'h1'}, children: 'Heading'} as never), {wrapper})
    expect(screen.getByRole('heading', {level: 1})).toHaveTextContent('Heading')
  })

  it('renders the custom decorator for `highlight` (adapted), built-in for others', () => {
    const renderDecorator = createRenderDecorator(decoratorMap)
    render(
      renderDecorator({
        value: 'highlight',
        schemaType: {value: 'highlight', title: 'Highlight'},
        children: 'Marked',
      } as never),
    )
    const mark = screen.getByTestId('highlight')
    expect(mark).toHaveTextContent('Marked')
    expect(mark).toHaveAttribute('data-title', 'Highlight')

    render(renderDecorator({value: 'strong', children: 'Bold'} as never))
    expect(screen.getByText('Bold').tagName).toBe('STRONG')
  })

  it('renders the custom annotation for `link` and `footnote` (editor props)', () => {
    const renderAnnotation = createRenderAnnotation(annotationMap)
    render(
      renderAnnotation({
        schemaType: {name: 'link'},
        value: {_key: 'a'},
        children: 'Linked',
      } as never),
    )
    expect(screen.getByTestId('link')).toHaveTextContent('Linked')

    render(
      renderAnnotation({
        schemaType: {name: 'footnote'},
        value: {_key: 'b'},
        children: 'Noted',
      } as never),
    )
    expect(screen.getByTestId('footnote')).toHaveTextContent('Noted')
  })

  it('renders a dotted-underline fallback for a custom annotation with no component', () => {
    // No custom components → non-link annotations get the built-in *visible*
    // default (dotted underline + data-annotation tag) rather than plain text.
    const renderAnnotation = createRenderAnnotation()
    render(
      renderAnnotation({
        schemaType: {name: 'keyword'},
        value: {_key: 'c'},
        children: 'Term',
      } as never),
    )
    const span = screen.getByText('Term')
    expect(span).toHaveAttribute('data-annotation', 'keyword')
    expect(span).toHaveStyle({textDecorationStyle: 'dotted'})
  })

  it('renders the built-in link annotation with a solid (not dotted) underline', () => {
    const renderAnnotation = createRenderAnnotation()
    render(
      renderAnnotation({
        schemaType: {name: 'link', fields: [{name: 'href', type: 'url'}]},
        value: {_key: 'l'},
        children: 'Linked',
      } as never),
    )
    const span = screen.getByText('Linked')
    expect(span).toHaveStyle({textDecoration: 'underline'})
    expect(span).not.toHaveStyle({textDecorationStyle: 'dotted'})
  })
})
