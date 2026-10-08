import { useEffect, useRef } from 'react'

import { useMapContext } from './MapContext'

/** Full-viewport div the single ol/Map instance renders into. */
export function MapCanvas() {
  const { map } = useMapContext()
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    map.setTarget(container)
    return () => map.setTarget(undefined)
  }, [map])

  return <div ref={containerRef} data-testid="map-canvas" className="absolute inset-0" />
}
