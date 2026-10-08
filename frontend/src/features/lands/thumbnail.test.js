import { describe, expect, it } from 'vitest'

import { squarePolygon } from '@/test/fixtures'

import { polygonToSvgPath } from './thumbnail'

describe('polygonToSvgPath', () => {
  it('produces a closed path that fits the viewBox', () => {
    const path = polygonToSvgPath(squarePolygon(-47.9, -15.8), 56)
    expect(path.startsWith('M ')).toBe(true)
    expect(path.endsWith('Z')).toBe(true)
    const numbers = path.match(/-?\d+(\.\d+)?/g).map(Number)
    expect(Math.min(...numbers)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...numbers)).toBeLessThanOrEqual(56)
  })

  it('returns an empty path for degenerate rings', () => {
    expect(
      polygonToSvgPath({ type: 'Polygon', coordinates: [[[0, 0]]] }, 56),
    ).toBe('')
  })

  it('handles zero-width geometries without dividing by zero', () => {
    const path = polygonToSvgPath(
      { type: 'Polygon', coordinates: [[[0, 0], [0, 1], [0, 2], [0, 0]]] },
      56,
    )
    expect(path).toContain('M ')
  })
})
