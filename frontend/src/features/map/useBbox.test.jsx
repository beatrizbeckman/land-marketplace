import { act, renderHook } from '@testing-library/react'
import { fromLonLat } from 'ol/proj'
import { describe, expect, it } from 'vitest'

import { createMapContextValue } from '@/test/utils'

import { MapContext } from './MapContext'
import { useBbox } from './useBbox'

function setup() {
  const value = createMapContextValue()
  const wrapper = ({ children }) => (
    <MapContext.Provider value={value}>{children}</MapContext.Provider>
  )
  return { value, ...renderHook(() => useBbox(), { wrapper }) }
}

describe('useBbox', () => {
  it('starts without a bbox until the map has a size', () => {
    const { value, result } = setup()
    act(() => {
      value.map.dispatchEvent('moveend')
    })
    expect(result.current).toBeNull()
  })

  it('computes the lon/lat bbox of the visible extent on moveend', () => {
    const { value, result } = setup()
    value.map.setSize([800, 600])
    value.map.getView().setCenter(fromLonLat([-47.9, -15.8]))

    act(() => {
      value.map.dispatchEvent('moveend')
    })

    const bbox = result.current
    expect(bbox[0]).toBeLessThan(-47.9)
    expect(bbox[2]).toBeGreaterThan(-47.9)
    expect(bbox[1]).toBeLessThan(-15.8)
    expect(bbox[3]).toBeGreaterThan(-15.8)
  })
})
