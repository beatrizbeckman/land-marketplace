import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { makeLand } from '@/test/fixtures'
import { createMapContextValue } from '@/test/utils'

import { MapContext } from './MapContext'
import { useLandsLayer } from './useLandsLayer'

const baseState = {
  selectedId: null,
  hoveredId: null,
  conflictId: null,
  dimmed: false,
}

function setup(state = baseState) {
  const value = createMapContextValue()
  const wrapper = ({ children }) => (
    <MapContext.Provider value={value}>{children}</MapContext.Provider>
  )
  const lands = [makeLand(1), makeLand(2, { lon: 0.01 })]
  const hook = renderHook(
    ({ currentState }) => useLandsLayer(lands, currentState),
    { wrapper, initialProps: { currentState: state } },
  )
  return { ...hook, value }
}

describe('useLandsLayer', () => {
  it('adds the layer to the map and removes it on unmount', () => {
    const { value, unmount } = setup()
    expect(value.map.getLayers().getLength()).toBe(1)
    unmount()
    expect(value.map.getLayers().getLength()).toBe(0)
  })

  it('loads one feature per land, keyed by the land id', () => {
    const { result } = setup()
    const features = result.current.source.getFeatures()
    expect(features).toHaveLength(2)
    expect(features.map((feature) => feature.getId()).sort()).toEqual([1, 2])
  })

  it('styles the selected land with the selection halo', () => {
    const { result, rerender } = setup()
    rerender({ currentState: { ...baseState, selectedId: 1 } })

    const styleFn = result.current.layer.getStyle()
    const feature = result.current.source.getFeatures().find((f) => f.getId() === 1)
    const styles = styleFn(feature, 1)
    expect(styles).toHaveLength(2)
    expect(styles[0].getStroke().getColor()).toBe('white')
  })

  it('adds the satellite halo to unselected lands by default', () => {
    const { result } = setup()
    const styleFn = result.current.layer.getStyle()
    const feature = result.current.source.getFeatures()[0]
    expect(styleFn(feature, 1)).toHaveLength(2) // halo + fill/stroke
  })
})
