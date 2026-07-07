import {Box, Button, Card, Stack, Text} from '@sanity/ui'
import {Component, type ErrorInfo, type ReactNode} from 'react'

interface CellErrorBoundaryProps {
  children: ReactNode
  /** Human-readable cell location, used in the fallback and the console log. */
  label?: string
}

interface CellErrorBoundaryState {
  error: Error | null
}

/**
 * Contains a render crash to the single cell that caused it, so one bad cell —
 * malformed content, or a throwing custom render component (e.g. a reference
 * object reaching a renderer: _"Objects are not valid as a React child"_) —
 * doesn't blank the whole table.
 *
 * On success it renders its children with **no wrapper element**, so the
 * CSS-grid cell layout is unaffected. On error it renders a compact critical
 * card in place of that one cell (keeping `role="cell"` so the grid/ARIA stay
 * intact), with a **Try again** button that re-attempts the render once the
 * underlying data is fixed (e.g. via the input's debug mode).
 */
export class CellErrorBoundary extends Component<CellErrorBoundaryProps, CellErrorBoundaryState> {
  state: CellErrorBoundaryState = {error: null}

  static getDerivedStateFromError(error: Error): CellErrorBoundaryState {
    return {error}
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    const where = this.props.label ? ` (${this.props.label})` : ''
    // Keep the failure visible for debugging, scoped to the offending cell.
    console.error(`[sanity-plugin-rich-table] a table cell failed to render${where}:`, error, info)
  }

  private handleRetry = (): void => this.setState({error: null})

  render(): ReactNode {
    const {error} = this.state
    if (!error) return this.props.children

    return (
      <Card tone="critical" padding={3} radius={2} border role="cell">
        <Stack space={3}>
          <Box>
            <Text size={1} weight="medium">
              This cell couldn’t be displayed
            </Text>
          </Box>
          <Box>
            <Text size={0} muted>
              {error.message}
            </Text>
          </Box>
          <Box>
            <Button
              mode="ghost"
              tone="critical"
              fontSize={1}
              padding={2}
              text="Try again"
              onClick={this.handleRetry}
            />
          </Box>
        </Stack>
      </Card>
    )
  }
}
