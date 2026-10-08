import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { useEffect, useRef, useState } from 'react'

import { geoJson } from '@/shared/lib/geo'

import { landStyle } from './landStyles'
import { useMapContext } from './MapContext'

/**
 * Renders the lands returned by the API as a vector layer. Style state
 * (selection, hover, conflict, dimming, satellite halo) lives in a ref read
 * by the style function, so updating it only redraws the layer instead of
 * rebuilding features.
 */
export function useLandsLayer(lands, state) {
  const { map, baseLayer } = useMapContext()
  const stateRef = useRef({ ...state, satellite: baseLayer === 'satellite' })

  const [source] = useState(() => new VectorSource())
  const [layer] = useState(
    () =>
      new VectorLayer({
        source,
        zIndex: 1,
        style: (feature) => {
          const id = feature.getId()
          const current = stateRef.current
          return landStyle({
            selected: current.selectedId === id,
            hovered: current.hoveredId === id && current.selectedId !== id,
            dimmed: current.dimmed,
            conflict: current.conflictId === id,
            satelliteHalo: current.satellite,
          })
        },
      }),
  )

  useEffect(() => {
    map.addLayer(layer)
    return () => {
      map.removeLayer(layer)
    }
  }, [map, layer])

  useEffect(() => {
    source.clear()
    const features = geoJson.readFeatures({
      type: 'FeatureCollection',
      features: lands,
    })
    for (const feature of features) {
      feature.setId((feature.get('id')) ?? undefined)
    }
    source.addFeatures(features)
  }, [source, lands])

  useEffect(() => {
    stateRef.current = { ...state, satellite: baseLayer === 'satellite' }
    layer.changed()
  }, [layer, state, baseLayer])

  return { source, layer }
}
