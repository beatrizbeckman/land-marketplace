import { act, renderHook } from '@testing-library/react'
import Feature from 'ol/Feature'
import Draw from 'ol/interaction/Draw'
import Modify from 'ol/interaction/Modify'
import Snap from 'ol/interaction/Snap'
import VectorSource from 'ol/source/Vector'
import { describe, expect, it, vi } from 'vitest'

import { MapContext } from '@/features/map/MapContext'
import { polygonFromGeoJson } from '@/shared/lib/geo'
import { squarePolygon } from '@/test/fixtures'
import { createMapContextValue } from '@/test/utils'

import { useDraftPolygon } from './useDraftPolygon'

function setup(mode = 'draw', snapSource = null) {
  const value = createMapContextValue()
  const onSketchChange = vi.fn()
  const onPolygonChange = vi.fn()
  const wrapper = ({ children }) => (
    <MapContext.Provider value={value}>{children}</MapContext.Provider>
  )
  const hook = renderHook(
    ({ currentMode }) =>
      useDraftPolygon({
        mode: currentMode,
        snapSource,
        invalid: false,
        onSketchChange,
        onPolygonChange,
      }),
    { wrapper, initialProps: { currentMode: mode } },
  )
  const interactions = () => value.map.getInteractions().getArray()
  const findDraw = () => interactions().find((i) => i instanceof Draw)
  return { value, onSketchChange, onPolygonChange, interactions, findDraw, ...hook }
}

describe('useDraftPolygon', () => {
  it('adds Draw (and Snap over the lands) in draw mode and removes them on cleanup', () => {
    const snapSource = new VectorSource()
    const { interactions, rerender } = setup('draw', snapSource)
    expect(interactions().some((i) => i instanceof Draw)).toBe(true)
    expect(interactions().some((i) => i instanceof Snap)).toBe(true)

    rerender({ currentMode: 'edit'})
    expect(interactions().some((i) => i instanceof Draw)).toBe(false)
    expect(interactions().some((i) => i instanceof Snap)).toBe(false)
  })

  it('reports vertices, live area and cursor while sketching', () => {
    const { findDraw, onSketchChange } = setup()
    const polygon = polygonFromGeoJson(squarePolygon(0, 0, 0.001))
    const feature = new Feature(polygon)

    act(() => {
      findDraw().dispatchEvent({ type: 'drawstart', feature })
      polygon.setCoordinates(polygon.getCoordinates()) // geometry change event
    })

    const info = onSketchChange.mock.lastCall[0]
    expect(info.vertices).toBe(3) // 4 ring vertices minus the cursor position
    expect(info.areaSqm).toBeGreaterThan(10_000)
    expect(info.polygon).toBe(polygon)
  })

  it('hands the closed polygon to the parent on drawend', () => {
    const { findDraw, onPolygonChange } = setup()
    const polygon = polygonFromGeoJson(squarePolygon(0, 0))
    act(() => {
      findDraw().dispatchEvent({ type: 'drawend', feature: new Feature(polygon) })
    })
    expect(onPolygonChange).toHaveBeenCalledWith(polygon)
  })

  it('aborts on Esc and removes the last vertex on Ctrl+Z', () => {
    const { findDraw } = setup()
    const draw = findDraw()
    const abort = vi.spyOn(draw, 'abortDrawing').mockImplementation(() => {})
    const removeLast = vi.spyOn(draw, 'removeLastPoint').mockImplementation(() => {})

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    expect(abort).toHaveBeenCalled()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }))
    expect(removeLast).toHaveBeenCalled()
  })

  it('exposes undoLastPoint for the panel button', () => {
    const { findDraw, result } = setup()
    const removeLast = vi
      .spyOn(findDraw(), 'removeLastPoint')
      .mockImplementation(() => {})
    act(() => result.current.undoLastPoint())
    expect(removeLast).toHaveBeenCalled()
  })

  it('keeps the closed polygon editable in edit mode and reports every change', () => {
    const { result, interactions, onPolygonChange, rerender } = setup('draw')
    const polygon = polygonFromGeoJson(squarePolygon(0, 0))
    result.current.source.addFeature(new Feature(polygon))

    rerender({ currentMode: 'edit'})
    expect(interactions().some((i) => i instanceof Modify)).toBe(true)

    act(() => {
      polygon.setCoordinates(polygon.getCoordinates())
    })
    expect(onPolygonChange).toHaveBeenCalledWith(polygon)
  })

  it('clear() empties the draft source', () => {
    const { result } = setup()
    result.current.source.addFeature(new Feature(polygonFromGeoJson(squarePolygon(0, 0))))
    act(() => result.current.clear())
    expect(result.current.source.getFeatures()).toHaveLength(0)
  })
})
