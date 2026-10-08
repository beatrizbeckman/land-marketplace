import { act, renderHook } from '@testing-library/react'
import Feature from 'ol/Feature'
import CircleGeometry from 'ol/geom/Circle'
import Draw from 'ol/interaction/Draw'
import Modify from 'ol/interaction/Modify'
import { fromLonLat } from 'ol/proj'
import { describe, expect, it, vi } from 'vitest'

import { MapContext } from '@/features/map/MapContext'
import { circleRadiusMeters } from '@/shared/lib/geo'
import { createMapContextValue } from '@/test/utils'

import { SEARCH_DEBOUNCE_MS, useCircleSearch } from './useCircleSearch'

function setup(drawActive = true) {
  const value = createMapContextValue()
  const onSearchChange = vi.fn()
  const wrapper = ({ children }) => (
    <MapContext.Provider value={value}>{children}</MapContext.Provider>
  )
  const hook = renderHook(
    ({ active }) => useCircleSearch({ drawActive: active, onSearchChange }),
    { wrapper, initialProps: { active: drawActive } },
  )
  const findDraw = () =>
    value.map
      .getInteractions()
      .getArray()
      .find((interaction) => interaction instanceof Draw)
  return { value, onSearchChange, findDraw, ...hook }
}

describe('useCircleSearch', () => {
  it('adds the Draw interaction only while the search tool is active', () => {
    const { findDraw, rerender } = setup(true)
    expect(findDraw()).toBeDefined()
    rerender({ active: false })
    expect(findDraw()).toBeUndefined()
  })

  it('searches with the geodesic radius when the drag ends', () => {
    const { findDraw, onSearchChange, result } = setup()
    const circle = new CircleGeometry(fromLonLat([-47.9, -15.8]), 2_000)
    const feature = new Feature(circle)

    act(() => {
      findDraw().dispatchEvent({ type: 'drawstart', feature })
    })
    expect(onSearchChange).toHaveBeenCalledWith(null)

    act(() => {
      findDraw().dispatchEvent({ type: 'drawend', feature })
    })

    const applied = onSearchChange.mock.lastCall[0]
    expect(applied.lon).toBeCloseTo(-47.9, 4)
    expect(applied.lat).toBeCloseTo(-15.8, 4)
    expect(applied.radius).toBeCloseTo(circleRadiusMeters(circle), 6)
    expect(result.current.hasCircle).toBe(true)
    expect(result.current.live?.radiusMeters).toBeCloseTo(circleRadiusMeters(circle), 6)
  })

  it('updates the live radius while the circle geometry changes', () => {
    const { findDraw, result } = setup()
    const circle = new CircleGeometry(fromLonLat([0, 0]), 1_000)
    const feature = new Feature(circle)

    act(() => {
      findDraw().dispatchEvent({ type: 'drawstart', feature })
      circle.setRadius(3_000)
    })

    expect(result.current.live?.radiusMeters).toBeCloseTo(circleRadiusMeters(circle), 6)
  })

  it('debounces the re-search while resizing an existing circle', () => {
    vi.useFakeTimers()
    const { findDraw, onSearchChange, value } = setup()
    const circle = new CircleGeometry(fromLonLat([0, 0]), 1_000)
    const feature = new Feature(circle)

    act(() => {
      findDraw().dispatchEvent({ type: 'drawstart', feature })
    })
    // Draw would add the feature to the source; do it manually before drawend.
    const layerSource = (value.map.getLayers().item(0)
    ).getSource()
    act(() => {
      layerSource.addFeature(feature)
      findDraw().dispatchEvent({ type: 'drawend', feature })
    })
    expect(
      value.map.getInteractions().getArray().some((i) => i instanceof Modify),
    ).toBe(true)
    onSearchChange.mockClear()

    act(() => {
      circle.setRadius(2_000) // user drags the edge
      circle.setRadius(2_500)
    })
    expect(onSearchChange).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS)
    })
    expect(onSearchChange).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('clears the circle and the active search', () => {
    const { findDraw, onSearchChange, result } = setup()
    const feature = new Feature(new CircleGeometry(fromLonLat([0, 0]), 1_000))
    act(() => {
      findDraw().dispatchEvent({ type: 'drawstart', feature })
      findDraw().dispatchEvent({ type: 'drawend', feature })
    })

    act(() => result.current.clear())

    expect(onSearchChange).toHaveBeenLastCalledWith(null)
    expect(result.current.hasCircle).toBe(false)
    expect(result.current.live).toBeNull()
  })

  it('aborts the sketch on Escape', () => {
    const { findDraw } = setup()
    const abort = vi.spyOn(findDraw(), 'abortDrawing').mockImplementation(() => {})
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(abort).toHaveBeenCalled()
  })
})
