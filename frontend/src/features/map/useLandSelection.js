import { useEffect } from 'react'

import { useMapContext } from './MapContext'

/** Click-to-select and hover highlight for lands rendered on the map. */
export function useLandSelection({ layer, enabled, onSelect, onHover }) {
  const { map } = useMapContext()

  useEffect(() => {
    if (!enabled) return

    const findLandId = (event) => {
      let found = null
      map.forEachFeatureAtPixel(
        event.pixel,
        (feature) => {
          found = typeof feature.getId() === 'number' ? (feature.getId()) : null
          return true
        },
        { layerFilter: (candidate) => candidate === layer },
      )
      return found
    }

    const onClick = (event) => {
      onSelect(findLandId(event))
    }
    const onPointerMove = (event) => {
      if (event.dragging) return
      const id = findLandId(event)
      onHover(id)
      const target = map.getTargetElement()
      if (target) target.style.cursor = id !== null ? 'pointer' : ''
    }

    map.on('click', onClick)
    map.on('pointermove', onPointerMove)
    return () => {
      map.un('click', onClick)
      map.un('pointermove', onPointerMove)
      const target = map.getTargetElement()
      if (target) target.style.cursor = ''
    }
  }, [map, layer, enabled, onSelect, onHover])
}
