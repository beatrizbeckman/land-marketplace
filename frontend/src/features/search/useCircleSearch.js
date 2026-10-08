import CircleGeometry from 'ol/geom/Circle'
import Draw from 'ol/interaction/Draw'
import Modify from 'ol/interaction/Modify'
import VectorLayer from 'ol/layer/Vector'
import { toLonLat } from 'ol/proj'
import VectorSource from 'ol/source/Vector'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useMapContext } from '@/features/map/MapContext'
import { circleRadiusMeters } from '@/shared/lib/geo'

import { createSearchStyle } from './searchStyles'

export const SEARCH_DEBOUNCE_MS = 300

/**
 * Owns the search circle: freehand drawing (press, drag, release), the live
 * radius while dragging, and resize/move editing afterwards with a debounced
 * re-search. The radius sent to the API is geodesic meters, not map units.
 */
export function useCircleSearch({ drawActive, onSearchChange }) {
  const { map } = useMapContext()
  const handleRef = useRef(null)
  const debounceRef = useRef(null)

  const [source] = useState(() => new VectorSource())
  const [layer] = useState(
    () => new VectorLayer({ source, zIndex: 2, style: createSearchStyle(handleRef) }),
  )
  const [live, setLive] = useState(null)
  const [hasCircle, setHasCircle] = useState(false)

  const toSearch = useCallback((circle) => {
    const [lon, lat] = toLonLat(circle.getCenter())
    return { lon: lon, lat: lat, radius: circleRadiusMeters(circle) }
  }, [])

  const applyDebounced = useCallback(
    (circle) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const search = toSearch(circle)
        if (search.radius > 0) onSearchChange(search)
      }, SEARCH_DEBOUNCE_MS)
    },
    [onSearchChange, toSearch],
  )

  useEffect(() => {
    map.addLayer(layer)
    return () => {
      map.removeLayer(layer)
    }
  }, [map, layer])

  // Freehand drawing while the Search area tool is active.
  useEffect(() => {
    if (!drawActive) return

    const draw = new Draw({
      source,
      type: 'Circle',
      freehand: true,
      style: createSearchStyle(handleRef),
    })

    const onPointerMove = (event) => {
      handleRef.current = event.coordinate
    }

    draw.on('drawstart', (event) => {
      source.clear()
      setHasCircle(false)
      onSearchChange(null)
      map.on('pointermove', onPointerMove)
      const circle = event.feature.getGeometry()
      circle.on('change', () => {
        setLive({
          radiusMeters: circleRadiusMeters(circle),
          labelCoordinate: handleRef.current ?? circle.getCenter(),
        })
      })
    })

    draw.on('drawend', (event) => {
      map.un('pointermove', onPointerMove)
      const circle = event.feature.getGeometry()
      handleRef.current = [circle.getCenter()[0] + circle.getRadius(), circle.getCenter()[1]]
      setLive({ radiusMeters: circleRadiusMeters(circle), labelCoordinate: handleRef.current })
      setHasCircle(true)
      const search = toSearch(circle)
      if (search.radius > 0) onSearchChange(search)
    })

    draw.on('drawabort', () => {
      map.un('pointermove', onPointerMove)
      setLive(null)
    })

    const onKeyDown = (event) => {
      if (event.key === 'Escape') draw.abortDrawing()
    }
    document.addEventListener('keydown', onKeyDown)
    map.addInteraction(draw)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      map.un('pointermove', onPointerMove)
      map.removeInteraction(draw)
    }
  }, [map, source, drawActive, onSearchChange, toSearch])

  // Resize (edge) and move (center) once a circle exists, re-searching debounced.
  useEffect(() => {
    if (!hasCircle) return

    const modify = new Modify({ source })
    const feature = source.getFeatures()[0]
    const circle = feature?.getGeometry()
    if (!(circle instanceof CircleGeometry)) return

    const onGeometryChange = () => {
      const handle = [
        circle.getCenter()[0] + circle.getRadius(),
        circle.getCenter()[1],
      ]
      handleRef.current = handle
      setLive({ radiusMeters: circleRadiusMeters(circle), labelCoordinate: handle })
      applyDebounced(circle)
    }
    circle.on('change', onGeometryChange)
    map.addInteraction(modify)

    return () => {
      circle.un('change', onGeometryChange)
      map.removeInteraction(modify)
    }
  }, [map, source, hasCircle, applyDebounced])

  const clear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    source.clear()
    handleRef.current = null
    setLive(null)
    setHasCircle(false)
    onSearchChange(null)
  }, [source, onSearchChange])

  return { live, hasCircle, clear }
}
