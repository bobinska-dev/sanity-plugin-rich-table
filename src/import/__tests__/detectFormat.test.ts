import {describe, expect, it} from 'vitest'

import {detectFormat} from '../detectFormat'

describe('detectFormat', () => {
  it('detects HTML when clipboard contains <table>', () => {
    expect(detectFormat('<table><tr><td>x</td></tr></table>', 'x')).toBe('html')
  })

  it('detects markdown table from pipe-delimited text with separator', () => {
    const md = '| A | B |\n| - | - |\n| 1 | 2 |'
    expect(detectFormat('', md)).toBe('markdown')
  })

  it('detects TSV from tab-separated multi-line text', () => {
    const tsv = 'A\tB\n1\t2'
    expect(detectFormat('', tsv)).toBe('tsv')
  })

  it('returns null for plain text without table patterns', () => {
    expect(detectFormat('', 'Hello world')).toBeNull()
  })

  it('returns null for empty inputs', () => {
    expect(detectFormat('', '')).toBeNull()
  })

  it('prefers HTML over markdown when both are present', () => {
    const html = '<table><tr><td>x</td></tr></table>'
    const md = '| A | B |\n| - | - |\n| 1 | 2 |'
    expect(detectFormat(html, md)).toBe('html')
  })

  it('prefers markdown over TSV when text has both patterns', () => {
    const text = '| A\t| B |\n| -\t| - |\n| 1\t| 2 |'
    expect(detectFormat('', text)).toBe('markdown')
  })

  it('does not detect single-line TSV (too weak a signal)', () => {
    expect(detectFormat('', 'A\tB')).toBeNull()
  })

  it('does not detect single-column TSV', () => {
    expect(detectFormat('', 'A\nB\nC')).toBeNull()
  })

  it('does not auto-detect CSV', () => {
    expect(detectFormat('', 'A,B\n1,2')).toBeNull()
  })
})
