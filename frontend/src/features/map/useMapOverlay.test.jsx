import { renderHook } from '@testing-library/react'
import { fromLonLat } from 'ol/proj'
import { describe, expect, it } from 'vitest'

import { createMapContextValue } from '@/test/utils'

import { MapContext } from './MapContext'
import { useMapOverlay } from './useMapOverlay'

function setup() {
  const value = createMapContextValue()
  const wrapper = ({ children }) => (
    <MapContext.Provider value={value}>{children}</MapContext.Provider>
  )
  return { value, ...renderHook(() => useMapOverlay({ positioning: 'center-center' }), { wrapper }) }
}

describe('useMapOverlay', () => {
  it('registers a single overlay on the map', () => {
    const { value } = setup()
    expect(value.map.getOverlays().getLength()).toBe(1)
  })

  it('moves and hides the overlay through setPosition', () => {
    const { value, result } = setup()
    const overlay = value.map.getOverlays().item(0)
    const coordinate = fromLonLat([-47.9, -15.8])

    result.current.setPosition(coordinate)
    expect(overlay.getPosition()).toEqual(coordinate)

    result.current.setPosition(undefined)
    expect(overlay.getPosition()).toBeUndefined()
  })

  it('removes the overlay on unmount', () => {
    const { value, unmount } = setup()
    unmount()
    expect(value.map.getOverlays().getLength()).toBe(0)
  })
})
