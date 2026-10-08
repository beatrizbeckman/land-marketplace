import { renderHook, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MapProvider, useMapContext } from './MapContext'

describe('MapProvider', () => {
  it('creates one map with the three base layers, satellite visible by default', () => {
    const { result } = renderHook(() => useMapContext(), { wrapper: MapProvider })
    const layers = result.current.map.getLayers().getArray()
    expect(layers).toHaveLength(3)
    const visibility = Object.fromEntries(
      layers.map((layer) => [layer.get('baseKey'), layer.getVisible()]),
    )
    expect(visibility).toEqual({ satellite: true, terrain: false, streets: false })
  })

  it('switches the visible base layer without recreating the map', () => {
    const { result } = renderHook(() => useMapContext(), { wrapper: MapProvider })
    const mapBefore = result.current.map

    act(() => result.current.setBaseLayer('terrain'))

    expect(result.current.map).toBe(mapBefore)
    const layers = result.current.map.getLayers().getArray()
    expect(layers.find((l) => l.get('baseKey') === 'terrain').getVisible()).toBe(true)
    expect(layers.find((l) => l.get('baseKey') === 'satellite').getVisible()).toBe(false)
  })

  it('throws when used outside the provider', () => {
    expect(() => renderHook(() => useMapContext())).toThrow(
      'useMapContext must be used inside MapProvider',
    )
  })
})
