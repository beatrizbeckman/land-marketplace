import { act, render, screen } from '@testing-library/react'
import { fromLonLat } from 'ol/proj'
import { describe, expect, it } from 'vitest'

import { createMapContextValue, withMapContext } from '@/test/utils'

import { MapStatusBar } from './MapStatusBar'

describe('MapStatusBar', () => {
  it('registers the scale line control', () => {
    const value = createMapContextValue()
    render(withMapContext(<MapStatusBar />, value))
    expect(value.map.getControls().getLength()).toBe(1)
  })

  it('shows the cursor coordinates as lon, lat with 5 decimals', () => {
    const value = createMapContextValue()
    render(withMapContext(<MapStatusBar />, value))

    act(() => {
      value.map.dispatchEvent({
        type: 'pointermove',
        coordinate: fromLonLat([-47.9, -15.8]),
      })
    })

    expect(screen.getByText('-47.90000, -15.80000')).toBeInTheDocument()
  })

  it('cleans up the control on unmount', () => {
    const value = createMapContextValue()
    const { unmount } = render(withMapContext(<MapStatusBar />, value))
    unmount()
    expect(value.map.getControls().getLength()).toBe(0)
  })
})
