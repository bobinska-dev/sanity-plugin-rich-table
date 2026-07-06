import {useCallback} from 'react'
import {
  isKeySegment,
  isValidationErrorMarker,
  isValidationWarningMarker,
  type Path,
  pathToString,
  type ValidationMarker,
} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

/** Tone applied to a cell based on the most severe marker it holds. */
export type CellValidationTone = 'critical' | 'caution' | undefined

export interface CellValidation {
  /** Every marker at or below the queried path. */
  markers: ValidationMarker[]
  /** `critical` when any error, else `caution` when any warning, else undefined. */
  tone: CellValidationTone
}

/**
 * A marker path is "under" a cell when it equals the cell path or continues it
 * at a segment boundary (`.field` or `[index/_key]`). The boundary check stops
 * `rows[0]` from also matching `rows[10]`.
 */
function isUnderPath(candidate: string, prefix: string): boolean {
  return (
    candidate === prefix || candidate.startsWith(`${prefix}.`) || candidate.startsWith(`${prefix}[`)
  )
}

/**
 * Collect the markDef `_key`s of annotations that carry an error marker, so the
 * annotation renderer can redden exactly those. A markDef marker path looks like
 * `…content[_key==block].markDefs[_key==md].href`; the key we want is the
 * `{_key}` segment immediately after the `markDefs` segment.
 */
export function invalidAnnotationKeysFrom(markers: ValidationMarker[]): Set<string> {
  const keys = new Set<string>()
  for (const marker of markers) {
    if (marker.level !== 'error') continue
    const {path} = marker
    for (let i = 0; i < path.length - 1; i++) {
      const next = path[i + 1]
      if (path[i] === 'markDefs' && isKeySegment(next)) keys.add(next._key)
    }
  }
  return keys
}

/** `critical` when any error, else `caution` when any warning, else undefined. */
function toneForMarkers(markers: ValidationMarker[]): CellValidationTone {
  if (markers.some(isValidationErrorMarker)) return 'critical'
  if (markers.some(isValidationWarningMarker)) return 'caution'
  return undefined
}

/**
 * Buckets the document's validation markers onto individual rich-table cells.
 *
 * The custom table renderer replaces Sanity's native field chrome and hides the
 * default input, so validation markers — especially deep ones on Portable Text
 * mark definitions (e.g. a Link's URL) — never render inline; they only appear
 * in the validation inspector. We read the flat, document-wide marker list off
 * the document pane (the same source the inspector uses, so it already contains
 * every nested marker with an absolute path) and match each marker to a cell by
 * path prefix.
 *
 * Returns a lookup keyed by path; call it with any cell / column-header / row
 * path to get that node's aggregated markers and tone.
 */
export function useTableCellValidation(): (path: Path) => CellValidation {
  const {validation} = useDocumentPane()

  return useCallback(
    (path: Path): CellValidation => {
      const prefix = pathToString(path)
      const markers = validation.filter((marker) => isUnderPath(pathToString(marker.path), prefix))
      return {markers, tone: toneForMarkers(markers)}
    },
    [validation],
  )
}
