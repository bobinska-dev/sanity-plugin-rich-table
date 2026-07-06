import type {ComponentType} from 'react'
import {describe, expect, it} from 'vitest'

import {
  createExtendInlineObject,
  extendInlineObject,
} from '../../../portable-text/configs/extendInlineObject'

const Icon: ComponentType = () => null

/** The editor's inline-object schema is richly typed; tests only need `name`. */
const inline = (name: string) => ({name}) as never

describe('extendInlineObject', () => {
  it('the default export is a no-op that passes the inline object through', () => {
    const result = extendInlineObject(inline('mention')) as {name: string; icon?: unknown}
    expect(result.name).toBe('mention')
    expect(result.icon).toBeUndefined()
  })

  it('createExtendInlineObject() with no schemas is a no-op', () => {
    const extend = createExtendInlineObject()
    const result = extend(inline('mention')) as {name: string; icon?: unknown}
    expect(result.name).toBe('mention')
    expect(result.icon).toBeUndefined()
  })

  it('merges the schema icon onto the matching inline object', () => {
    const extend = createExtendInlineObject([{name: 'mention', icon: Icon}])
    const result = extend(inline('mention')) as {name: string; icon?: unknown}
    expect(result.icon).toBe(Icon)
  })

  it('leaves inline objects with no matching schema unchanged', () => {
    const extend = createExtendInlineObject([{name: 'mention', icon: Icon}])
    const result = extend(inline('footnote')) as {name: string; icon?: unknown}
    expect(result.name).toBe('footnote')
    expect(result.icon).toBeUndefined()
  })

  it('does not add an icon key when the schema has none', () => {
    const extend = createExtendInlineObject([{name: 'mention'}])
    const result = extend(inline('mention')) as {name: string; icon?: unknown}
    expect(result.icon).toBeUndefined()
  })
})
