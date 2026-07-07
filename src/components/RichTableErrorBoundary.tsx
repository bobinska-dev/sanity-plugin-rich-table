import {Box, Button, Card, Stack, Text} from '@sanity/ui'
import {Component, type ErrorInfo, type ReactNode} from 'react'

interface RichTableErrorBoundaryProps {
  children: ReactNode
  /** Short noun for the console log, e.g. "cell" or "table". */
  what?: string
  /** Extra location context for the console log (e.g. "column 2, row 1"). */
  label?: string
  /** Fallback heading shown in place of the crashed subtree. */
  title?: string
  /** ARIA role for the fallback element (cells pass "cell" to keep the grid intact). */
  role?: string
}

interface RichTableErrorBoundaryState {
  error: Error | null
}

/**
 * Contains a render crash to the plugin surface that caused it — a single cell,
 * or the whole table UI — so it doesn't blank the surrounding document, and
 * **always logs the error (with its React component stack) to the console** so
 * the failure is diagnosable instead of silently hidden behind the fallback.
 *
 * Transparent on success (renders its children with no wrapper element, so the
 * CSS-grid / layout is unaffected); on error it renders a compact critical card
 * with a **Try again** reset for once the underlying data is fixed.
 */
export class RichTableErrorBoundary extends Component<
  RichTableErrorBoundaryProps,
  RichTableErrorBoundaryState
> {
  state: RichTableErrorBoundaryState = {error: null}

  static getDerivedStateFromError(error: Error): RichTableErrorBoundaryState {
    return {error}
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    const what = this.props.what ?? 'component'
    const where = this.props.label ? ` (${this.props.label})` : ''
    // Always surface the crash — message + React component stack — so a caught
    // failure is debuggable from the console rather than silently swallowed by
    // the fallback card.
    console.error(
      `[sanity-plugin-rich-table] a table ${what} failed to render${where}: ${error.message}`,
      error,
      info.componentStack,
    )
  }

  private handleRetry = (): void => this.setState({error: null})

  render(): ReactNode {
    const {error} = this.state
    if (!error) return this.props.children

    return (
      <Card tone="critical" padding={3} radius={2} border role={this.props.role}>
        <Stack space={3}>
          <Box>
            <Text size={1} weight="medium">
              {this.props.title ?? 'This content couldn’t be displayed'}
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
