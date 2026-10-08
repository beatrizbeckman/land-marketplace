import { renderHook } from '@testing-library/react'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import VectorLayer from 'ol/layer/Vector'
import { describe, expect, it, vi } from 'vitest'

import { createMapContextValue } from '@/test/utils'

import { MapContext } from './MapContext'
import { useLandSelection } from './useLandSelection'

function setup(enabled = true) {
  const value = createMapContextValue()
  const layer = new VectorLayer()
  const onSelect = vi.fn()
  const onHover = vi.fn()

  const feature = new Feature(new Point([0, 0]))
  feature.setId(3)
  // forEachFeatureAtPixel needs a rendered frame; stub the hit test instead.
  value.map.forEachFeatureAtPixel = vi.fn(
    (_pixel, callback) =>
      callback(feature, layer),
  )

  const wrapper = ({ children }) => (
    <MapContext.Provider value={value}>{children}</MapContext.Provider>
  )
  const hook = renderHook(
    () => useLandSelection({ layer, enabled, onSelect, onHover }),
    { wrapper },
  )
  return { value, onSelect, onHover, ...hook }
}

describe('useLandSelection', () => {
  it('selects the land under the cursor on click', () => {
    const { value, onSelect } = setup()
    value.map.dispatchEvent({ type: 'click', pixel: [1, 1] })
    expect(onSelect).toHaveBeenCalledWith(3)
  })

  it('reports hover on pointer move and ignores drags', () => {
    const { value, onHover } = setup()
    value.map.dispatchEvent({ type: 'pointermove', pixel: [1, 1], dragging: false })
    expect(onHover).toHaveBeenCalledWith(3)

    onHover.mockClear()
    value.map.dispatchEvent({ type: 'pointermove', pixel: [1, 1], dragging: true })
    expect(onHover).not.toHaveBeenCalled()
  })

  it('does nothing while disabled', () => {
    const { value, onSelect } = setup(false)
    value.map.dispatchEvent({ type: 'click', pixel: [1, 1] })
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('stops listening after unmount', () => {
    const { value, onSelect, unmount } = setup()
    unmount()
    value.map.dispatchEvent({ type: 'click', pixel: [1, 1] })
    expect(onSelect).not.toHaveBeenCalled()
  })
})
