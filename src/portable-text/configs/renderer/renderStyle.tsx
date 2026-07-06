/* * * * * * RENDER FUNCTIONS */
import {RenderStyleFunction} from '@portabletext/editor'
import {Box, Heading, Text} from '@sanity/ui'
import type {ComponentType} from 'react'
import type {BlockStyleProps} from 'sanity'

/**
 * A consumer-supplied custom style component, keyed by style value. Consumers
 * define it with Sanity's own `component` field on a block style and type it
 * against Sanity's {@link BlockStyleProps} — the exact API they'd use for any
 * Sanity Portable Text input. The plugin adapts its editor render props to that
 * shape (see {@link createRenderStyle}).
 */
export type StyleComponent = ComponentType<BlockStyleProps>

const renderBuiltinStyle: RenderStyleFunction = (props) => {
  if (props.schemaType.value === 'normal') {
    return (
      <Box paddingBottom={3}>
        <Text size={1}>{props.children}</Text>
      </Box>
    )
  }
  if (props.schemaType.value === 'h1') {
    return (
      <Heading as={'h1'} size={2} weight={'bold'} style={{margin: '1rem 0'}} tabIndex={-1}>
        {props.children}
      </Heading>
    )
  }
  if (props.schemaType.value === 'h2') {
    return (
      <Heading as={'h2'} size={2} weight={'bold'} style={{margin: '1rem 0'}} tabIndex={-1}>
        {props.children}
      </Heading>
    )
  }
  if (props.schemaType.value === 'h3') {
    return (
      <Heading as={'h3'} size={1} weight={'bold'} style={{margin: '1rem 0'}} tabIndex={-1}>
        {props.children}
      </Heading>
    )
  }
  if (props.schemaType.value === 'h4') {
    return (
      <Heading as={'h4'} size={1} weight={'semibold'} style={{margin: '1rem 0'}} tabIndex={-1}>
        {props.children}
      </Heading>
    )
  }
  if (props.schemaType.value === 'h5') {
    return (
      <Heading as={'h5'} size={1} weight={'semibold'} style={{margin: '1rem 0'}} tabIndex={-1}>
        {props.children}
      </Heading>
    )
  }
  if (props.schemaType.value === 'h6') {
    return (
      <Heading as={'h6'} size={1} weight={'semibold'} style={{margin: '1rem 0'}} tabIndex={-1}>
        {props.children}
      </Heading>
    )
  }

  if (props.schemaType.value === 'blockquote') {
    return (
      <blockquote tabIndex={-1} aria-label={'Block quote'}>
        <Box>
          <Text size={1} muted style={{fontStyle: 'italic'}}>
            {props.children}
          </Text>
        </Box>
      </blockquote>
    )
  }
  // Custom style: render a paragraph-like block tagged with its name so consumers
  // can target it via CSS (e.g. [data-style="lead"]) instead of it rendering as
  // indistinct inline text with no block spacing.
  return (
    <Box paddingBottom={3} data-style={props.schemaType.value}>
      <Text size={1}>{props.children}</Text>
    </Box>
  )
}

/**
 * Build a `renderStyle` that prefers a consumer's custom component (defined via
 * the native `{value, component}` on the block's `styles`) for the matching
 * style value, and otherwise falls back to the built-in presentation above.
 *
 * The consumer's component is typed for Sanity's {@link BlockStyleProps}, so the
 * editor's `BlockStyleRenderProps` are adapted to that shape here — with the
 * built-in renderer supplied as `renderDefault` so consumers can defer to it.
 */
export const createRenderStyle = (
  components?: ReadonlyMap<string, StyleComponent>,
): RenderStyleFunction => {
  return function RenderStyle(props) {
    const Custom = components?.get(props.schemaType.value)
    if (!Custom) return renderBuiltinStyle(props)
    const title = props.schemaType.title ?? props.schemaType.value
    const sanityProps: BlockStyleProps = {
      block: props.block,
      children: props.children,
      focused: props.focused,
      selected: props.selected,
      title,
      value: props.value,
      schemaType: {title, value: props.schemaType.value},
      renderDefault: () => renderBuiltinStyle(props),
    }
    return <Custom {...sanityProps} />
  }
}

/** Built-in-only `renderStyle` (no consumer custom components). */
const renderStyle = createRenderStyle()
export default renderStyle
