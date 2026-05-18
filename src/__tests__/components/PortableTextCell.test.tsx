import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {fireEvent, render, screen} from '@testing-library/react'
import type {ReactNode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

// Mock Sanity dependencies before importing component
const mockOnChange = vi.fn()
const mockFormCallbacks = {
  onChange: mockOnChange,
  onBlur: vi.fn(),
  onFocus: vi.fn(),
  onPathBlur: vi.fn(),
  onPathFocus: vi.fn(),
  onPathOpen: vi.fn(),
  onSetPathCollapsed: vi.fn(),
  onSetFieldSetCollapsed: vi.fn(),
}

// Store the onChange callback passed to FormCallbacksProvider for testing
let capturedOnChange: ((event: any) => void) | null = null

vi.mock('sanity', async () => {
  const actual = await vi.importActual('sanity')
  return {
    ...actual,
    useFormCallbacks: () => mockFormCallbacks,
    FormCallbacksProvider: ({children, onChange}: {children: ReactNode; onChange: any}) => {
      capturedOnChange = onChange
      return (
        <div data-testid="form-callbacks-provider" data-has-onchange={!!onChange}>
          {children}
        </div>
      )
    },
    MemberField: ({member}: {member: any}) => (
      <div data-testid="member-field" data-member-name={member?.name}>
        Mock Field Content
      </div>
    ),
    PortableTextInput: () => <div data-testid="pte-input">PTE Input</div>,
  }
})

import PortableTextCell from '../../components/PortableTextCell'

// Test wrapper with Sanity UI theme
const theme = buildTheme()

const wrapper = ({children}: {children: ReactNode}) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
)

// Mock render props (required by component interface)
const mockRenderProps = {
  renderInput: vi.fn(() => <div data-testid="render-input" />),
  renderField: vi.fn((props) => <div>{props.children}</div>),
  renderItem: vi.fn(),
  renderPreview: vi.fn(),
  renderBlock: vi.fn(),
  renderInlineBlock: vi.fn(),
  renderAnnotation: vi.fn(),
}

// Mock field member
const createMockMember = () =>
  ({
    kind: 'field' as const,
    name: 'content',
    field: {
      path: ['rows', 0, 'cells', 0, 'content'],
    },
  }) as any

// Mock patch (disabled must be literal false, not boolean)
const createMockPatch = () => ({
  execute: vi.fn(),
  disabled: false as const,
})

describe('PortableTextCell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedOnChange = null
  })

  describe('rendering', () => {
    it('renders CellCard with correct data attributes', () => {
      render(
        <PortableTextCell
          member={createMockMember()}
          isSelected={false}
          isEditing={false}
          cellKey="1-2"
          cellLabel="Cell C2"
          {...mockRenderProps}
        />,
        {wrapper},
      )

      const cell = screen.getByRole('cell')
      expect(cell).toHaveAttribute('data-cell-key', '1-2')
      expect(cell).toHaveAttribute('aria-label', 'Cell C2')
      expect(cell).toHaveAttribute('aria-selected', 'false')
    })

    it('renders aria-selected=true when selected', () => {
      render(
        <PortableTextCell
          member={createMockMember()}
          isSelected
          isEditing={false}
          cellKey="0-0"
          cellLabel="Cell A1"
          {...mockRenderProps}
        />,
        {wrapper},
      )

      expect(screen.getByRole('cell')).toHaveAttribute('aria-selected', 'true')
    })

    it('renders empty placeholder when no member', () => {
      render(
        <PortableTextCell
          member={undefined}
          isSelected={false}
          isEditing={false}
          cellKey="0-0"
          cellLabel="Cell A1"
          {...mockRenderProps}
        />,
        {wrapper},
      )

      // Cell should render with empty placeholder (min-height box, no text)
      const cell = screen.getByRole('cell')
      expect(cell).toBeInTheDocument()
      expect(screen.queryByTestId('member-field')).not.toBeInTheDocument()
    })

    it('renders MemberField when member is provided', () => {
      render(
        <PortableTextCell
          member={createMockMember()}
          isSelected={false}
          isEditing={false}
          cellKey="0-0"
          cellLabel="Cell A1"
          {...mockRenderProps}
        />,
        {wrapper},
      )

      expect(screen.getByTestId('member-field')).toBeInTheDocument()
    })
  })

  describe('edit button', () => {
    it('shows edit button when selected and not editing', () => {
      render(
        <PortableTextCell
          member={createMockMember()}
          isSelected
          isEditing={false}
          cellKey="0-0"
          cellLabel="Cell A1"
          onEditClick={vi.fn()}
          {...mockRenderProps}
        />,
        {wrapper},
      )

      expect(screen.getByLabelText('Edit cell')).toBeInTheDocument()
    })

    it('hides edit button when not selected', () => {
      render(
        <PortableTextCell
          member={createMockMember()}
          isSelected={false}
          isEditing={false}
          cellKey="0-0"
          cellLabel="Cell A1"
          onEditClick={vi.fn()}
          {...mockRenderProps}
        />,
        {wrapper},
      )

      expect(screen.queryByLabelText('Edit cell')).not.toBeInTheDocument()
    })

    it('hides edit button when editing', () => {
      render(
        <PortableTextCell
          member={createMockMember()}
          isSelected
          isEditing
          cellKey="0-0"
          cellLabel="Cell A1"
          onEditClick={vi.fn()}
          {...mockRenderProps}
        />,
        {wrapper},
      )

      expect(screen.queryByLabelText('Edit cell')).not.toBeInTheDocument()
    })

    it('hides edit button when tableReadOnly', () => {
      render(
        <PortableTextCell
          member={createMockMember()}
          isSelected
          isEditing={false}
          tableReadOnly
          cellKey="0-0"
          cellLabel="Cell A1"
          onEditClick={vi.fn()}
          {...mockRenderProps}
        />,
        {wrapper},
      )

      expect(screen.queryByLabelText('Edit cell')).not.toBeInTheDocument()
    })

    it('calls onEditClick when edit button is clicked', () => {
      const onEditClick = vi.fn()
      render(
        <PortableTextCell
          member={createMockMember()}
          isSelected
          isEditing={false}
          cellKey="0-0"
          cellLabel="Cell A1"
          onEditClick={onEditClick}
          {...mockRenderProps}
        />,
        {wrapper},
      )

      fireEvent.click(screen.getByLabelText('Edit cell'))
      expect(onEditClick).toHaveBeenCalledTimes(1)
    })

    it('stops propagation when edit button is clicked', () => {
      const onClick = vi.fn()
      const onEditClick = vi.fn()
      render(
        <PortableTextCell
          member={createMockMember()}
          isSelected
          isEditing={false}
          cellKey="0-0"
          cellLabel="Cell A1"
          onClick={onClick}
          onEditClick={onEditClick}
          {...mockRenderProps}
        />,
        {wrapper},
      )

      fireEvent.click(screen.getByLabelText('Edit cell'))
      // onClick should NOT be called due to stopPropagation
      expect(onClick).not.toHaveBeenCalled()
      expect(onEditClick).toHaveBeenCalled()
    })
  })

  describe('event handlers', () => {
    it('calls onClick when cell is clicked', () => {
      const onClick = vi.fn()
      render(
        <PortableTextCell
          member={createMockMember()}
          isSelected={false}
          isEditing={false}
          cellKey="0-0"
          cellLabel="Cell A1"
          onClick={onClick}
          {...mockRenderProps}
        />,
        {wrapper},
      )

      fireEvent.click(screen.getByRole('cell'))
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('calls onDoubleClick when cell is double-clicked', () => {
      const onDoubleClick = vi.fn()
      render(
        <PortableTextCell
          member={createMockMember()}
          isSelected={false}
          isEditing={false}
          cellKey="0-0"
          cellLabel="Cell A1"
          onDoubleClick={onDoubleClick}
          {...mockRenderProps}
        />,
        {wrapper},
      )

      fireEvent.doubleClick(screen.getByRole('cell'))
      expect(onDoubleClick).toHaveBeenCalledTimes(1)
    })

    it('calls onKeyDown when key is pressed on cell', () => {
      const onKeyDown = vi.fn()
      render(
        <PortableTextCell
          member={createMockMember()}
          isSelected
          isEditing={false}
          cellKey="0-0"
          cellLabel="Cell A1"
          onKeyDown={onKeyDown}
          tabIndex={0}
          {...mockRenderProps}
        />,
        {wrapper},
      )

      fireEvent.keyDown(screen.getByRole('cell'), {key: 'Enter'})
      expect(onKeyDown).toHaveBeenCalledTimes(1)
    })

    it('sets tabIndex on cell', () => {
      render(
        <PortableTextCell
          member={createMockMember()}
          isSelected
          isEditing={false}
          cellKey="0-0"
          cellLabel="Cell A1"
          tabIndex={0}
          {...mockRenderProps}
        />,
        {wrapper},
      )

      expect(screen.getByRole('cell')).toHaveAttribute('tabindex', '0')
    })
  })

  describe('FormCallbacksProvider wrapping', () => {
    it('does not wrap with FormCallbacksProvider when not editing', () => {
      render(
        <PortableTextCell
          member={createMockMember()}
          isSelected={false}
          isEditing={false}
          cellKey="0-0"
          cellLabel="Cell A1"
          {...mockRenderProps}
        />,
        {wrapper},
      )

      expect(screen.queryByTestId('form-callbacks-provider')).not.toBeInTheDocument()
    })

    it('wraps with FormCallbacksProvider when editing', () => {
      render(
        <PortableTextCell
          member={createMockMember()}
          isSelected
          isEditing
          cellKey="0-0"
          cellLabel="Cell A1"
          {...mockRenderProps}
        />,
        {wrapper},
      )

      expect(screen.getByTestId('form-callbacks-provider')).toBeInTheDocument()
    })

    it('provides onChange to FormCallbacksProvider when editing', () => {
      render(
        <PortableTextCell
          member={createMockMember()}
          isSelected
          isEditing
          cellKey="0-0"
          cellLabel="Cell A1"
          {...mockRenderProps}
        />,
        {wrapper},
      )

      const provider = screen.getByTestId('form-callbacks-provider')
      expect(provider).toHaveAttribute('data-has-onchange', 'true')
    })
  })

  describe('path rewriting', () => {
    it('rewrites set patch paths with cellBasePath prefix', () => {
      const patch = createMockPatch()

      render(
        <PortableTextCell
          member={createMockMember()}
          isSelected
          isEditing
          cellBasePath={['rows', {_key: 'row1'}, 'cells', {_key: 'cell1'}]}
          patch={patch}
          cellKey="0-0"
          cellLabel="Cell A1"
          {...mockRenderProps}
        />,
        {wrapper},
      )

      // Call the captured onChange with a 'set' patch
      expect(capturedOnChange).toBeDefined()
      capturedOnChange!({
        patches: [{type: 'set', path: ['content', 0], value: 'new value'}],
      })

      expect(patch.execute).toHaveBeenCalledWith([
        {set: {'rows[_key=="row1"].cells[_key=="cell1"].content[0]': 'new value'}},
      ])
    })

    it('rewrites setIfMissing patch paths', () => {
      const patch = createMockPatch()

      render(
        <PortableTextCell
          member={createMockMember()}
          isSelected
          isEditing
          cellBasePath={['rows', {_key: 'row1'}, 'cells', {_key: 'cell1'}]}
          patch={patch}
          cellKey="0-0"
          cellLabel="Cell A1"
          {...mockRenderProps}
        />,
        {wrapper},
      )

      capturedOnChange!({
        patches: [{type: 'setIfMissing', path: ['content'], value: []}],
      })

      expect(patch.execute).toHaveBeenCalledWith([
        {setIfMissing: {'rows[_key=="row1"].cells[_key=="cell1"].content': []}},
      ])
    })

    it('rewrites unset patch paths', () => {
      const patch = createMockPatch()

      render(
        <PortableTextCell
          member={createMockMember()}
          isSelected
          isEditing
          cellBasePath={['rows', {_key: 'row1'}, 'cells', {_key: 'cell1'}]}
          patch={patch}
          cellKey="0-0"
          cellLabel="Cell A1"
          {...mockRenderProps}
        />,
        {wrapper},
      )

      capturedOnChange!({
        patches: [{type: 'unset', path: ['content', 0]}],
      })

      expect(patch.execute).toHaveBeenCalledWith([
        {unset: ['rows[_key=="row1"].cells[_key=="cell1"].content[0]']},
      ])
    })

    it('rewrites insert patch paths', () => {
      const patch = createMockPatch()

      render(
        <PortableTextCell
          member={createMockMember()}
          isSelected
          isEditing
          cellBasePath={['rows', {_key: 'row1'}, 'cells', {_key: 'cell1'}]}
          patch={patch}
          cellKey="0-0"
          cellLabel="Cell A1"
          {...mockRenderProps}
        />,
        {wrapper},
      )

      capturedOnChange!({
        patches: [
          {type: 'insert', position: 'after', path: ['content', 0], items: [{_type: 'block'}]},
        ],
      })

      expect(patch.execute).toHaveBeenCalledWith([
        {
          insert: {
            after: 'rows[_key=="row1"].cells[_key=="cell1"].content[0]',
            items: [{_type: 'block'}],
          },
        },
      ])
    })

    it('rewrites diffMatchPatch paths', () => {
      const patch = createMockPatch()

      render(
        <PortableTextCell
          member={createMockMember()}
          isSelected
          isEditing
          cellBasePath={['rows', {_key: 'row1'}, 'cells', {_key: 'cell1'}]}
          patch={patch}
          cellKey="0-0"
          cellLabel="Cell A1"
          {...mockRenderProps}
        />,
        {wrapper},
      )

      capturedOnChange!({
        patches: [
          {
            type: 'diffMatchPatch',
            path: ['content', 0, 'text'],
            value: '@@ -1,4 +1,5 @@\n test\n+s\n',
          },
        ],
      })

      expect(patch.execute).toHaveBeenCalledWith([
        {
          diffMatchPatch: {
            'rows[_key=="row1"].cells[_key=="cell1"].content[0].text':
              '@@ -1,4 +1,5 @@\n test\n+s\n',
          },
        },
      ])
    })

    it('does not call patch.execute when not editing', () => {
      const patch = createMockPatch()

      render(
        <PortableTextCell
          member={createMockMember()}
          isSelected={false}
          isEditing={false}
          cellBasePath={['rows', {_key: 'row1'}, 'cells', {_key: 'cell1'}]}
          patch={patch}
          cellKey="0-0"
          cellLabel="Cell A1"
          {...mockRenderProps}
        />,
        {wrapper},
      )

      // FormCallbacksProvider should not be rendered, so capturedOnChange is null
      expect(capturedOnChange).toBeNull()
      expect(patch.execute).not.toHaveBeenCalled()
    })

    it('calls parent onChange when no patches in event', () => {
      const patch = createMockPatch()

      render(
        <PortableTextCell
          member={createMockMember()}
          isSelected
          isEditing
          cellBasePath={['rows', {_key: 'row1'}, 'cells', {_key: 'cell1'}]}
          patch={patch}
          cellKey="0-0"
          cellLabel="Cell A1"
          {...mockRenderProps}
        />,
        {wrapper},
      )

      capturedOnChange!({someOtherProp: 'value'})

      expect(patch.execute).not.toHaveBeenCalled()
      expect(mockOnChange).toHaveBeenCalledWith({someOtherProp: 'value'})
    })
  })
})
