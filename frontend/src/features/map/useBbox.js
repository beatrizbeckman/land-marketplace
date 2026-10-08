import { useEffect, useState } from 'react'

import { extentToLonLatBbox } from '@/shared/lib/geo'

import { useMapContext } from './MapContext'

/**
 * Visible map area as a lon/lat bbox, updated on every moveend. Drives the
 * default listing when no circle search is active.
 */
export function useBbox() {
  const { map } = useMapContext()
  const [bbox, setBbox] = useState(null)

  useEffect(() => {
    const update = () => {
      const size = map.getSize()
      if (!size || size[0] === 0 || size[1] === 0) return
      setBbox(extentToLonLatBbox(map.getView().calculateExtent(size)))
    }
    map.on('moveend', update)
    map.once('rendercomplete', update)
    return () => {
      map.un('moveend', update)
      map.un('rendercomplete', update)
    }
  }, [map])

  return bbox
}
