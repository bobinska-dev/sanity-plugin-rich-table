import {BehaviorPlugin} from '@portabletext/editor/plugins'
import {useToast} from '@sanity/ui'
import {useEffect, useMemo, useRef} from 'react'

import {createTablePasteBehaviors, type ShowToastFn} from './tablePasteBehavior'

/**
 * Registers the table-paste behaviors on the surrounding Portable Text editor
 * and bridges the `@sanity/ui` toast system so a pasted table can report its
 * import result.
 *
 * Drop it into a document-body Portable Text input's plugins to enable
 * "paste a spreadsheet / HTML / markdown table → rich table block". The toast
 * callback is passed via a ref so each editor instance stays independent.
 *
 * The inserted block's `_type` is auto-detected per paste from the field's own
 * schema, so a `richTableBlock` member registered under any name — e.g.
 * `defineArrayMember({name: 'richTable', type: 'richTableBlock'})` — is honoured
 * automatically, with no configuration.
 *
 * @example
 * ```tsx
 * // in your PortableText input's `renderEditable` / plugins slot
 * <RichTablePastePlugin />
 * ```
 */
export function RichTablePastePlugin() {
  const toast = useToast()
  const showToastRef = useRef<ShowToastFn | null>(null)

  // Keep the ref pointed at the latest toast pusher. Set in an effect (not
  // during render) so it complies with the refs lint rule.
  useEffect(() => {
    showToastRef.current = (payload) => toast.push(payload)
    return () => {
      showToastRef.current = null
    }
  }, [toast])

  // The behaviors capture the ref object and read `.current` only inside
  // paste-time effects — never during render.
  // eslint-disable-next-line react-hooks/refs
  const behaviors = useMemo(() => createTablePasteBehaviors(showToastRef), [])

  return <BehaviorPlugin behaviors={behaviors} />
}
