import {RenderDecoratorFunction} from '@portabletext/editor'
import type {ComponentType} from 'react'
import type {BlockDecoratorProps} from 'sanity'

/**
 * A consumer-supplied custom decorator component, keyed by decorator value.
 * Defined with Sanity's native `component` field on a decorator and typed
 * against Sanity's {@link BlockDecoratorProps}; the plugin adapts its editor
 * render props to that shape (see {@link createRenderDecorator}).
 */
export type DecoratorComponent = ComponentType<BlockDecoratorProps>

const renderBuiltinDecorator: RenderDecoratorFunction = (props) => {
  if (props.value === 'strong') {
    return <strong>{props.children}</strong>
  }
  if (props.value === 'em') {
    return <em>{props.children}</em>
  }
  if (props.value === 'underline') {
    return <u>{props.children}</u>
  }
  if (props.value === 'code') {
    return (
      <code
        style={{
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
          backgroundColor: 'var(--card-code-bg-color)',
          color: 'var(--card-code-fg-color)',
          padding: '0.125em 0.3em',
          borderRadius: '1px',
          mixBlendMode: 'screen',
        }}
        aria-label={`Code: ${props.children}`}
      >
        {props.children}
      </code>
    )
  }
  if (props.value === 'strike-through') {
    return <s>{props.children}</s>
  }
  // Custom decorator: render a styleable span tagged with its name so consumers
  // can target it via CSS (e.g. [data-decorator="highlight"]) instead of it
  // rendering as indistinct plain text.
  return <span data-decorator={props.value}>{props.children}</span>
}

/**
 * Build a `renderDecorator` that prefers a consumer's custom component (defined
 * via the native `{value, component}` on the block's `marks.decorators`) for the
 * matching decorator value, and otherwise falls back to the built-in
 * presentation above.
 *
 * The consumer's component is typed for Sanity's {@link BlockDecoratorProps}, so
 * the editor's `BlockDecoratorRenderProps` are adapted to that shape here — with
 * the built-in renderer supplied as `renderDefault`.
 */
export const createRenderDecorator = (
  components?: ReadonlyMap<string, DecoratorComponent>,
): RenderDecoratorFunction => {
  return function RenderDecorator(props) {
    const Custom = components?.get(props.value)
    if (!Custom) return renderBuiltinDecorator(props)
    const title = props.schemaType.title ?? props.value
    const sanityProps: BlockDecoratorProps = {
      children: props.children,
      focused: props.focused,
      selected: props.selected,
      title,
      value: props.value,
      schemaType: {title, value: props.value},
      renderDefault: () => renderBuiltinDecorator(props),
    }
    return <Custom {...sanityProps} />
  }
}

/** Built-in-only `renderDecorator` (no consumer custom components). */
const renderDecorator = createRenderDecorator()
export default renderDecorator
