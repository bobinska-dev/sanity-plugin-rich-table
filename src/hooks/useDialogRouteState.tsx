import {useCallback, useMemo, useState} from 'react'
import {usePaneRouter} from 'sanity/structure'

/** Per-pane URL param that holds the encoded field path of the open table editor. */
const EXPAND_PARAM = 'richTableExpand'

/**
 * Drives the expanded table editor's open/closed state from the Structure tool's
 * URL params — the same mechanism document inspectors use (`usePaneRouter().setParams`,
 * which is what `openInspector`/`closeInspector` call under the hood). This makes the
 * dialog deep-linkable, refresh-persistent, and closable with the browser back button.
 *
 * Design notes (the gotchas this deliberately handles):
 *
 * 1. **Disambiguation by path.** A document can hold several table fields (and tables
 *    nested inside Portable Text). We store the *encoded field path* as the param
 *    *value* (not a bare boolean), so only the matching field's dialog opens. One param
 *    means one open dialog at a time — the desired modal behaviour.
 * 2. **Path encoding.** `pathToString` emits e.g. `rows[_key=="r1"].content`, which
 *    contains `=`, `[`, `]`, `"` — the very characters the router's pane-string grammar
 *    uses as delimiters (`=`, `,`, `;`, `|`). `encodeURIComponent` neutralises them so
 *    the value round-trips through the URL intact.
 * 3. **`setParams` overwrites.** It replaces the whole params object rather than merging,
 *    so we always spread the current `params` first to preserve sibling state (`view`,
 *    etc.) — exactly what Studio's own `openInspector` does.
 * 4. **Structure-tool-context only.** `usePaneRouter()` itself never throws, and reading
 *    `params` is always safe, but its `setParams` throws ("Pane is missing router context")
 *    when rendered outside the Structure tool (Presentation, a custom non-structure pane,
 *    a standalone form). `routerPanesState` is `[]` precisely in that case, so it doubles
 *    as an "are we inside Structure?" signal. Outside Structure we fall back to local
 *    React state so the editor still opens and the plugin never crashes.
 * 5. **History entries.** `setParams` navigates (a history *push*, not replace), so each
 *    open/close adds a back-stack entry. That is intentional here: pressing back closes
 *    the dialog.
 */
export const useDialogRouteState = (pathString: string) => {
  const paneRouter = usePaneRouter()
  const {setParams, routerPanesState} = paneRouter
  // Memoise so the ?? {} fallback doesn't hand the callbacks a fresh object each render.
  const params = useMemo(() => paneRouter.params ?? {}, [paneRouter.params])

  // Only the Structure tool provides a real PaneRouterContext; elsewhere routerPanesState
  // is the empty default and setParams would throw. (gotcha #4)
  const inStructure = routerPanesState.length > 0

  // (gotcha #2)
  const paramValue = useMemo(() => encodeURIComponent(pathString), [pathString])

  // Fallback for out-of-Structure rendering. (gotcha #4)
  const [localOpen, setLocalOpen] = useState(false)

  const open = inStructure ? params[EXPAND_PARAM] === paramValue : localOpen

  const handleOpen = useCallback(() => {
    if (inStructure) {
      // spread to preserve other pane params (gotcha #3)
      setParams({...params, [EXPAND_PARAM]: paramValue})
    } else {
      setLocalOpen(true)
    }
  }, [inStructure, params, setParams, paramValue])

  const handleClose = useCallback(() => {
    if (inStructure) {
      setParams({...params, [EXPAND_PARAM]: undefined})
    } else {
      setLocalOpen(false)
    }
  }, [inStructure, params, setParams])

  return {open, handleOpen, handleClose}
}
