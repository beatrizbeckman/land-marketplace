import Feature from 'ol/Feature'
import CircleGeometry from 'ol/geom/Circle'
import Point from 'ol/geom/Point'
import { describe, expect, it } from 'vitest'

import { createSearchStyle } from './searchStyles'

describe('createSearchStyle', () => {
  it('renders circle, center line and handles for a circle feature', () => {
    const styleFn = createSearchStyle({ current: [50, 0] })
    const styles = styleFn(new Feature(new CircleGeometry([0, 0], 100)))
    expect(styles).toHaveLength(3)
    expect(styles[0].getStroke().getLineDash()).toEqual([8, 6])
  })

  it('falls back to the east edge when there is no cursor handle', () => {
    const styleFn = createSearchStyle({ current: null })
    const styles = styleFn(new Feature(new CircleGeometry([10, 20], 100)))
    const line = styles[1].getGeometry()
    expect(line).toBeTypeOf('object')
    expect((line).getType()).toBe('LineString')
  })

  it('ignores non-circle sketch features', () => {
    const styleFn = createSearchStyle({ current: null })
    expect(styleFn(new Feature(new Point([0, 0])))).toEqual([])
  })
})
