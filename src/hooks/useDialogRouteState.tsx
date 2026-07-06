import {useCallback, useMemo, useState} from 'react'
import {usePaneRouter} from 'sanity/structure'

/** Per-pane URL param that holds the encoded field path of the open table editor. */
const EXPAND_PARAM = 'richTableExpand'

/**
 * Per-pane URL param that holds the encoded `<mode>:<path>` of the open
 * "promote to header" confirmation ({@link ../components/ConfirmPromoteHeaderDialog}).
 * Kept separate from {@link EXPAND_PARAM} so a confirmation can sit *on top of* the
 * expanded editor without either clobbering the other.
 */
export const PROMOTE_PARAM = 'richTablePromote'

/**
 * Opaque, URL- and pane-grammar-safe token identifying one promote confirmation.
 *
 * We only ever compare it for equality (never decode), so encoding the whole
 * `<mode>:<path>` string is enough — it both disambiguates which table/mode owns
 * the dialog and neutralises the router grammar's delimiters (`=`, `,`, `;`, `|`)
 * that a field path contains.
 */
export const promoteDialogParamValue = (mode: string, pathString: string) =>
  encodeURIComponent(`${mode}:${pathString}`)

/**
 * Drives a dialog's open/closed state from the Structure tool's URL params — the
 * same mechanism document inspectors use (`usePaneRouter().setParams`, which is what
 * `openInspector`/`closeInspector` call under the hood). This makes the dialog
 * deep-linkable, refresh-persistent, and closable with the browser back button.
 *
 * The dialog is identified by a (`param`, `value`) pair; see {@link useDialogRouteState}
 * (the expanded editor) and {@link promoteDialogParamValue} (promote confirmations)
 * for the two concrete registrations.
 *
 * Design notes (the gotchas this deliberately handles):
 *
 * 1. **Disambiguation by value.** A document can hold several table fields (and tables
 *    nested inside Portable Text). We store an *encoded, path-specific value* (not a bare
 *    boolean), so only the matching dialog opens. One param means one open dialog at a
 *    time for that param — the desired modal behaviour.
 * 2. **Value encoding.** A field path such as `rows[_key=="r1"].content` contains `=`,
 *    `[`, `]`, `"` — the very characters the router's pane-string grammar uses as
 *    delimiters (`=`, `,`, `;`, `|`). Callers pass an `encodeURIComponent`-ed value so it
 *    round-trips through the URL intact.
 * 3. **`setParams` overwrites.** It replaces the whole params object rather than merging,
 *    so we always spread the current `params` first to preserve sibling state (`view`,
 *    the expand param, etc.) — exactly what Studio's own `openInspector` does.
 * 4. **Structure-tool-context only.** `usePaneRouter()` itself never throws, and reading
 *    `params` is always safe, but its `setParams` throws ("Pane is missing router context")
 *    when rendered outside the Structure tool (Presentation, a custom non-structure pane,
 *    a standalone form). `routerPanesState` is `[]` precisely in that case, so it doubles
 *    as an "are we inside Structure?" signal. Outside Structure we fall back to local
 *    React state so the dialog still opens and the plugin never crashes.
 * 5. **History entries.** `setParams` navigates (a history *push*, not replace), so each
 *    open/close adds a back-stack entry. That is intentional here: pressing back closes
 *    the dialog.
 */
export const useRouteDialogState = (param: string, value: string) => {
  const paneRouter = usePaneRouter()
  const {setParams, routerPanesState} = paneRouter
  // Memoise so the ?? {} fallback doesn't hand the callbacks a fresh object each render.
  const params = useMemo(() => paneRouter.params ?? {}, [paneRouter.params])

  // Only the Structure tool provides a real PaneRouterContext; elsewhere routerPanesState
  // is the empty default and setParams would throw. (gotcha #4)
  const inStructure = routerPanesState.length > 0

  // Fallback for out-of-Structure rendering. (gotcha #4)
  const [localOpen, setLocalOpen] = useState(false)

  const open = inStructure ? params[param] === value : localOpen

  const handleOpen = useCallback(() => {
    if (inStructure) {
      // spread to preserve other pane params (gotcha #3)
      setParams({...params, [param]: value})
    } else {
      setLocalOpen(true)
    }
  }, [inStructure, params, setParams, param, value])

  const handleClose = useCallback(() => {
    if (inStructure) {
      setParams({...params, [param]: undefined})
    } else {
      setLocalOpen(false)
    }
  }, [inStructure, params, setParams, param])

  return {open, handleOpen, handleClose}
}

/**
 * Expanded table editor open state, keyed by the encoded field path (gotcha #2).
 * Thin wrapper over {@link useRouteDialogState}.
 */
export const useDialogRouteState = (pathString: string) =>
  useRouteDialogState(EXPAND_PARAM, encodeURIComponent(pathString))
