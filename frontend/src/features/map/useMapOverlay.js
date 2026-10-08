import Overlay from 'ol/Overlay'
import { useCallback, useEffect, useState } from 'react'

import { useMapContext } from './MapContext'

/**
 * Owns one ol/Overlay and its DOM container. React content is rendered into
 * the container with createPortal, so components never touch OpenLayers
 * positioning directly.
 */
export function useMapOverlay(options) {
  const { map } = useMapContext()
  const [container] = useState(() => document.createElement('div'))
  const [overlay] = useState(
    () =>
      new Overlay({
        element: container,
        positioning: options.positioning,
        offset: options.offset,
        stopEvent: true,
        ...(options.autoPan && { autoPan: { animation: { duration: 200 } } }),
      }),
  )

  useEffect(() => {
    map.addOverlay(overlay)
    return () => {
      map.removeOverlay(overlay)
    }
  }, [map, overlay])

  const setPosition = useCallback(
    (coordinate) => {
      overlay.setPosition(coordinate)
    },
    [overlay],
  )

  return { container, setPosition }
}
