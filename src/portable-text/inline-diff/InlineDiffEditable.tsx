import {
  type EditorSelection,
  type PortableTextEditableProps,
  type RangeDecoration,
  useEditor,
  useEditorSelector,
} from '@portabletext/editor'
import {Component, type ErrorInfo, type PropsWithChildren, type ReactNode, useMemo} from 'react'
import type {Path} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {DIFF_ADDED_BG, DIFF_REMOVED_BG} from '../../utils/diffColors'
import {StyledPortableTextEditable} from '../components/StyledPortableTextEditable'
import {type CellDiffRange, computeCellDiffRanges, rangeToSelection} from './computeCellDiffRanges'
import {getValueAtPath} from './getValueAtPath'

// Inline-change highlights, echoing Sanity's positive/critical diff tones and
// kept semi-transparent so they tint the live editor's own background.
function AddedInline({children}: PropsWithChildren) {
  return <span style={{backgroundColor: DIFF_ADDED_BG, borderRadius: '2px'}}>{children}</span>
}

function RemovedInline({text}: {text: string}) {
  return (
    <span
      style={{
        backgroundColor: DIFF_REMOVED_BG,
        borderRadius: '2px',
        opacity: 0.85,
        textDecoration: 'line-through',
      }}
    >
      {text}
    </span>
  )
}

/** Turn block-relative diff ranges into editor range decorations against the
 * current value. Ranges that don't resolve to a span selection are skipped. */
function buildDecorations(ranges: CellDiffRange[], current: unknown): RangeDecoration[] {
  const decorations: RangeDecoration[] = []

  for (const range of ranges) {
    const selection = rangeToSelection(range, current)
    if (!selection) continue

    if (range.type === 'added') {
      decorations.push({selection: selection as EditorSelection, component: AddedInline})
    } else {
      const {text} = range
      decorations.push({
        selection: selection as EditorSelection,
        component: () => <RemovedInline text={text} />,
      })
    }
  }

  return decorations
}

interface InlineDiffEditableProps {
  /** Absolute document path of this cell's `content` field. */
  path: Path
  /** Render callbacks forwarded verbatim to the editable. */
  editableProps: PortableTextEditableProps
}

function InlineDiffEditableInner({path, editableProps}: InlineDiffEditableProps) {
  const editor = useEditor()
  // The "before" revision selected in the Review changes panel. Present on the
  // document pane (unlike DocumentChangeContext, which only wraps the review
  // pane); `null` when no revision is being compared → no decorations.
  const {compareValue} = useDocumentPane()

  const beforeContent = useMemo(() => getValueAtPath(compareValue, path), [compareValue, path])
  // Re-derive decorations as the editor value changes so highlights track edits.
  const currentValue = useEditorSelector(editor, (snapshot) => snapshot.context.value)

  const rangeDecorations = useMemo(() => {
    const ranges = computeCellDiffRanges(beforeContent, currentValue)
    if (ranges.length === 0) return undefined
    return buildDecorations(ranges, currentValue)
  }, [beforeContent, currentValue])

  return <StyledPortableTextEditable {...editableProps} rangeDecorations={rangeDecorations} />
}

/**
 * Falls back to the plain editable if computing inline changes throws (e.g. the
 * document pane context is unexpectedly absent outside Structure). Editing must
 * never break just because the diff overlay can't be built.
 */
class InlineDiffBoundary extends Component<
  {fallback: ReactNode; children: ReactNode},
  {hasError: boolean}
> {
  state = {hasError: false}

  static getDerivedStateFromError() {
    return {hasError: true}
  }

  // eslint-disable-next-line class-methods-use-this
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Failed to render inline cell changes:', error, info)
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

/**
 * The cell editable with an inline diff overlay: added/changed text is
 * highlighted and deleted text is shown struck through, all on top of the still
 * fully-editable Portable Text editor. Used only when the Studio's "inline
 * changes" mode (`?displayInlineChanges=true`) is on.
 */
export function InlineDiffEditable({path, editableProps}: InlineDiffEditableProps): ReactNode {
  return (
    <InlineDiffBoundary fallback={<StyledPortableTextEditable {...editableProps} />}>
      <InlineDiffEditableInner path={path} editableProps={editableProps} />
    </InlineDiffBoundary>
  )
}
