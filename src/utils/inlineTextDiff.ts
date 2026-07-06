/**
 * Character-level inline diff between two plain-text strings, used to render a
 * single combined "before → after" view (removed text struck through, added
 * text highlighted) instead of two separate snapshots.
 *
 * It trims the common prefix and suffix and marks only the differing middle —
 * so `test` → `testr` highlights just `r`, and `hherr` → `hherrwrwr` highlights
 * just `wrwr`, rather than treating the whole token as replaced. A single
 * insertion or deletion is slid to the nearest whitespace boundary so whole
 * words read cleanly (deleting a middle word strikes `word `, not `ord w`).
 *
 * Like {@link portableTextToPlain}, this runs inside the read-only diff renderer
 * and the inline-change overlay, so it must **never throw**: on any unexpected
 * input it falls back to a coarse whole-string removed/added pair.
 */

export type InlineDiffStatus = 'added' | 'removed' | 'unchanged'

export interface InlineDiffSegment {
  value: string
  status: InlineDiffStatus
}

/** Coarse fallback: the whole `from` removed, the whole `to` added. */
function coarse(from: string, to: string): InlineDiffSegment[] {
  const segments: InlineDiffSegment[] = []
  if (from) segments.push({value: from, status: 'removed'})
  if (to) segments.push({value: to, status: 'added'})
  return segments
}

/** Append text to `segments`, merging into the last one when the status matches. */
function push(segments: InlineDiffSegment[], value: string, status: InlineDiffStatus): void {
  if (!value) return
  const last = segments[segments.length - 1]
  if (last && last.status === status) {
    last.value += value
  } else {
    segments.push({value, status})
  }
}

/** How cleanly an edit sits between `prefix` and `suffix`: an edge is clean when
 * it touches the start/end of the text or a whitespace character. The leading
 * edge is weighted higher so an edit prefers to begin at a word boundary. */
function edgeScore(prefix: string, edit: string, suffix: string): number {
  const leftClean = prefix === '' || /\s$/.test(prefix)
  const rightClean = suffix === '' || /^\s/.test(suffix)
  return (leftClean ? 2 : 0) + (rightClean ? 1 : 0)
}

/**
 * Slide a single-sided edit (a pure insertion or deletion) through the
 * repetition at its boundaries to the whitespace-aligned position that reads
 * best, keeping `prefix + edit + suffix` constant. This turns "one t|wo t|hree"
 * into "one |two |three". The roll conditions are identical for insertions and
 * deletions, so the same routine serves both.
 */
function alignEdit(
  prefix: string,
  edit: string,
  suffix: string,
): {prefix: string; edit: string; suffix: string} {
  // Roll as far left as the boundary repetition allows.
  while (edit && prefix && edit[edit.length - 1] === prefix[prefix.length - 1]) {
    const carried = prefix[prefix.length - 1]
    suffix = edit[edit.length - 1] + suffix
    edit = carried + edit.slice(0, -1)
    prefix = prefix.slice(0, -1)
  }

  // Then step right through every valid position, keeping the best-scoring one.
  let best = {prefix, edit, suffix, score: edgeScore(prefix, edit, suffix)}
  while (edit && suffix && edit[0] === suffix[0]) {
    prefix += edit[0]
    edit = edit.slice(1) + suffix[0]
    suffix = suffix.slice(1)
    const score = edgeScore(prefix, edit, suffix)
    if (score > best.score) best = {prefix, edit, suffix, score}
  }

  return {prefix: best.prefix, edit: best.edit, suffix: best.suffix}
}

/**
 * Diff two plain-text strings, returning an ordered list of segments describing
 * how to turn `from` into `to`: `unchanged` text common to both, `removed` text
 * only in `from`, and `added` text only in `to`. Where text was replaced the
 * `removed` run is emitted before the `added` run.
 */
export function inlineTextDiff(from: string, to: string): InlineDiffSegment[] {
  if (from === to) return from ? [{value: from, status: 'unchanged'}] : []

  try {
    // Compare by code point so surrogate pairs (emoji) aren't split.
    const a = Array.from(from)
    const b = Array.from(to)
    const n = a.length
    const m = b.length

    let prefixLen = 0
    while (prefixLen < n && prefixLen < m && a[prefixLen] === b[prefixLen]) prefixLen++

    let suffixLen = 0
    while (
      suffixLen < n - prefixLen &&
      suffixLen < m - prefixLen &&
      a[n - 1 - suffixLen] === b[m - 1 - suffixLen]
    ) {
      suffixLen++
    }

    const prefix = a.slice(0, prefixLen).join('')
    const suffix = a.slice(n - suffixLen).join('')
    const removed = a.slice(prefixLen, n - suffixLen).join('')
    const added = b.slice(prefixLen, m - suffixLen).join('')

    const segments: InlineDiffSegment[] = []

    if (removed && !added) {
      const aligned = alignEdit(prefix, removed, suffix)
      push(segments, aligned.prefix, 'unchanged')
      push(segments, aligned.edit, 'removed')
      push(segments, aligned.suffix, 'unchanged')
    } else if (!removed && added) {
      const aligned = alignEdit(prefix, added, suffix)
      push(segments, aligned.prefix, 'unchanged')
      push(segments, aligned.edit, 'added')
      push(segments, aligned.suffix, 'unchanged')
    } else {
      // A replacement: mark the whole differing middle.
      push(segments, prefix, 'unchanged')
      push(segments, removed, 'removed')
      push(segments, added, 'added')
      push(segments, suffix, 'unchanged')
    }

    return segments
  } catch {
    return coarse(from, to)
  }
}

/** Whether a diff contains any added or removed text (i.e. is worth highlighting). */
export function hasInlineChanges(segments: InlineDiffSegment[]): boolean {
  return segments.some((segment) => segment.status !== 'unchanged')
}
