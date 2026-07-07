import {describe, expect, it} from 'vitest'

import {defineRichTableBlock} from '../../schemas/richTable.block'

describe('richTableBlock schema', () => {
  const richTableBlock = defineRichTableBlock({})

  it('has correct name', () => {
    expect(richTableBlock.name).toBe('richTableBlock')
  })

  it('has correct title', () => {
    expect(richTableBlock.title).toBe('Rich Table Block')
  })

  it('extends richTable type', () => {
    expect(richTableBlock.type).toBe('richTable')
  })

  it('has block component defined', () => {
    expect(richTableBlock.components?.block).toBeDefined()
  })

  it('has input component defined', () => {
    expect(richTableBlock.components?.input).toBeDefined()
  })

  // Regression: a table authored as `richTableBlock` in a document body must
  // honour the plugin's `portableTextSchemaTypeName`. The static block used to
  // drop it, so cells fell back to the default schema. The factory now forwards
  // it (and `isInPortableText`) to RichTableInput — which is wrapped in the
  // RichTableErrorBoundary, so the forwarded props live on that boundary's child.
  it('forwards portableTextSchemaTypeName + isInPortableText to the input', () => {
    const Input = defineRichTableBlock({portableTextSchemaTypeName: 'myCellContent'}).components
      ?.input as (props: unknown) => {props: {children: {props: Record<string, unknown>}}}

    const boundary = Input({renderDefault: () => null})
    const input = boundary.props.children
    expect(input.props.portableTextSchemaTypeName).toBe('myCellContent')
    expect(input.props.isInPortableText).toBe(true)
  })
})
