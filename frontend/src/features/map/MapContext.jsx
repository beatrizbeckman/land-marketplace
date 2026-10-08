import Map from 'ol/Map'
import { fromLonLat } from 'ol/proj'
import View from 'ol/View'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  createBaseLayers,
  DEFAULT_BASE_LAYER,
} from './baseLayers'

/** Exported for tests, which inject a bare Map without a DOM target. */
export const MapContext = createContext(null)

/** Fallback view over Brazil until the user navigates. */
const INITIAL_CENTER = [-47.8825, -15.7942]
const INITIAL_ZOOM = 13

/**
 * Creates the single ol/Map instance for the whole app. Default controls are
 * disabled because zoom, scale, attribution and layer switching are custom
 * React components positioned by the design.
 */
export function MapProvider({ children }) {
  const [map] = useState(
    () =>
      new Map({
        controls: [],
        layers: createBaseLayers(),
        view: new View({
          center: fromLonLat(INITIAL_CENTER),
          zoom: INITIAL_ZOOM,
        }),
      }),
  )
  const [baseLayer, setBaseLayer] = useState(DEFAULT_BASE_LAYER)

  useEffect(() => {
    map.getLayers().forEach((layer) => {
      const key = layer.get('baseKey')
      if (key !== undefined) {
        layer.setVisible(key === baseLayer)
      }
    })
  }, [map, baseLayer])

  const value = useMemo(() => ({ map, baseLayer, setBaseLayer }), [map, baseLayer])

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>
}

export function useMapContext() {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error('useMapContext must be used inside MapProvider')
  }
  return context
}
