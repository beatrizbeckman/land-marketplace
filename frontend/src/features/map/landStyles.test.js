import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { describe, expect, it } from 'vitest'

import { polygonFromGeoJson } from '@/shared/lib/geo'
import { squarePolygon } from '@/test/fixtures'

import { draftStyle, landStyle } from './landStyles'

const baseFlags = {
  selected: false,
  hovered: false,
  dimmed: false,
  conflict: false,
  satelliteHalo: false,
}

describe('landStyle', () => {
  it('renders fill + stroke for a plain land', () => {
    const styles = landStyle(baseFlags)
    expect(styles).toHaveLength(1)
    expect(styles[0].getStroke().getWidth()).toBe(2)
  })

  it('adds a white halo on satellite imagery', () => {
    const styles = landStyle({ ...baseFlags, satelliteHalo: true })
    expect(styles).toHaveLength(2)
    expect(styles[0].getStroke().getColor()).toBe('white')
  })

  it('thickens the stroke on hover', () => {
    const styles = landStyle({ ...baseFlags, hovered: true })
    expect(styles[0].getStroke().getWidth()).toBe(3)
  })

  it('uses a strong halo and fill when selected, ignoring other flags', () => {
    const styles = landStyle({ ...baseFlags, selected: true, dimmed: true })
    expect(styles).toHaveLength(2)
    expect(styles[0].getStroke().getColor()).toBe('white')
    expect(styles[1].getStroke().getWidth()).toBe(3)
  })

  it('dims lands while drawing', () => {
    const styles = landStyle({ ...baseFlags, dimmed: true })
    expect(styles[0].getStroke().getColor()).toContain('0.55')
  })

  it('outlines the conflicting land in ink', () => {
    const styles = landStyle({ ...baseFlags, conflict: true })
    const last = styles[styles.length - 1]
    expect(last.getStroke().getColor()).toContain('16, 32, 26')
  })
})

describe('draftStyle', () => {
  const feature = new Feature(polygonFromGeoJson(squarePolygon(0, 0)))

  it('returns the polygon style plus vertex handles', () => {
    const styles = draftStyle(false)(feature)
    expect(styles).toHaveLength(2)
    expect(styles[1].getGeometry()).toBeTruthy()
  })

  it('switches to danger styling when invalid', () => {
    const styles = draftStyle(true)(feature)
    expect(styles[0].getStroke().getColor()).toContain('180, 35, 24')
  })

  it('handles non-polygon features without crashing', () => {
    const point = new Feature(new Point([0, 0]))
    expect(() => draftStyle(false)(point)).not.toThrow()
  })
})
