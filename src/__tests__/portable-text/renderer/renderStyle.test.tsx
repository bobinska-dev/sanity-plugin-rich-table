import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {render, screen} from '@testing-library/react'
import type {ReactNode} from 'react'
import {describe, expect, it} from 'vitest'

import renderStyle from '../../../portable-text/configs/renderer/renderStyle'

// Wrapper for Sanity UI components
const wrapper = ({children}: {children: ReactNode}) => (
  <ThemeProvider theme={buildTheme()}>{children}</ThemeProvider>
)

describe('renderStyle', () => {
  it('is a function', () => {
    expect(typeof renderStyle).toBe('function')
  })
})

describe('renderStyle normal', () => {
  it('renders paragraph with Text component', () => {
    const props = {schemaType: {value: 'normal'}, children: 'Normal text'}
    const result = renderStyle(props as never)
    render(result, {wrapper})

    expect(screen.getByText('Normal text')).toBeInTheDocument()
  })
})

describe('renderStyle headings', () => {
  // Note: Sanity UI Heading component wraps content in spans,
  // so we check for the heading element containing the text rather than the text element itself

  it('renders h1 heading element', () => {
    const props = {schemaType: {value: 'h1'}, children: 'Heading 1'}
    const result = renderStyle(props as never)
    render(result, {wrapper})

    const element = screen.getByRole('heading', {level: 1})
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('Heading 1')
  })

  it('renders h2 heading element', () => {
    const props = {schemaType: {value: 'h2'}, children: 'Heading 2'}
    const result = renderStyle(props as never)
    render(result, {wrapper})

    const element = screen.getByRole('heading', {level: 2})
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('Heading 2')
  })

  it('renders h3 heading element', () => {
    const props = {schemaType: {value: 'h3'}, children: 'Heading 3'}
    const result = renderStyle(props as never)
    render(result, {wrapper})

    const element = screen.getByRole('heading', {level: 3})
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('Heading 3')
  })

  it('renders h4 heading element', () => {
    const props = {schemaType: {value: 'h4'}, children: 'Heading 4'}
    const result = renderStyle(props as never)
    render(result, {wrapper})

    const element = screen.getByRole('heading', {level: 4})
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('Heading 4')
  })

  it('renders h5 heading element', () => {
    const props = {schemaType: {value: 'h5'}, children: 'Heading 5'}
    const result = renderStyle(props as never)
    render(result, {wrapper})

    const element = screen.getByRole('heading', {level: 5})
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('Heading 5')
  })

  it('renders h6 heading element', () => {
    const props = {schemaType: {value: 'h6'}, children: 'Heading 6'}
    const result = renderStyle(props as never)
    render(result, {wrapper})

    const element = screen.getByRole('heading', {level: 6})
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('Heading 6')
  })

  it('headings have tabIndex -1 for accessibility', () => {
    const props = {schemaType: {value: 'h1'}, children: 'Heading'}
    const result = renderStyle(props as never)
    render(result, {wrapper})

    const element = screen.getByRole('heading', {level: 1})
    expect(element).toHaveAttribute('tabindex', '-1')
  })
})

describe('renderStyle blockquote', () => {
  it('renders blockquote', () => {
    const props = {schemaType: {value: 'blockquote'}, children: 'Quote text'}
    const result = renderStyle(props as never)
    render(result, {wrapper})

    const element = screen.getByLabelText('Block quote')
    expect(element.tagName).toBe('BLOCKQUOTE')
  })

  it('blockquote has tabIndex -1', () => {
    const props = {schemaType: {value: 'blockquote'}, children: 'Quote text'}
    const result = renderStyle(props as never)
    render(result, {wrapper})

    const element = screen.getByLabelText('Block quote')
    expect(element).toHaveAttribute('tabindex', '-1')
  })
})

describe('renderStyle unknown', () => {
  it('renders children for unknown styles', () => {
    const props = {schemaType: {value: 'unknown'}, children: 'Unknown style text'}
    const result = renderStyle(props as never)
    render(result, {wrapper})

    expect(screen.getByText('Unknown style text')).toBeInTheDocument()
  })
})
