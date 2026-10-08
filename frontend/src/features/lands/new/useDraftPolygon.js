import Draw from 'ol/interaction/Draw'
import Modify from 'ol/interaction/Modify'
import Snap from 'ol/interaction/Snap'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { useCallback, useEffect, useRef, useState } from 'react'

import { draftStyle } from '@/features/map/landStyles'
import { useMapContext } from '@/features/map/MapContext'
import { polygonAreaSqm, polygonVertexCount } from '@/shared/lib/geo'

/**
 * Owns the draft polygon layer for the "List your land" flow: geojson.io-like
 * drawing (click to add, double-click/first-point to close, Esc aborts,
 * Ctrl+Z removes the last vertex, snap to existing lands) and vertex editing
 * after closing, until the land is saved.
 */
export function useDraftPolygon({
  mode,
  snapSource,
  invalid,
  onSketchChange,
  onPolygonChange,
}) {
  const { map } = useMapContext()
  const invalidRef = useRef(invalid)
  const drawRef = useRef(null)

  const [source] = useState(() => new VectorSource())
  const [layer] = useState(
    () =>
      new VectorLayer({
        source,
        zIndex: 3,
        style: (feature) => draftStyle(invalidRef.current)(feature),
      }),
  )

  useEffect(() => {
    invalidRef.current = invalid
    layer.changed()
  }, [layer, invalid])

  useEffect(() => {
    if (mode === null) return
    map.addLayer(layer)
    return () => {
      map.removeLayer(layer)
    }
  }, [map, layer, mode])

  // Step 1: drawing.
  useEffect(() => {
    if (mode !== 'draw') return

    const draw = new Draw({
      source,
      type: 'Polygon',
      style: (feature) => draftStyle(invalidRef.current)(feature),
    })
    drawRef.current = draw

    draw.on('drawstart', (event) => {
      const polygon = event.feature.getGeometry()
      polygon.on('change', () => {
        const ring = polygon.getCoordinates()[0] ?? []
        onSketchChange({
          // The sketch ring contains the fixed vertices plus the cursor and
          // the closing coordinate; show only the fixed vertices.
          vertices: Math.max(polygonVertexCount(polygon) - 1, 0),
          areaSqm: polygonAreaSqm(polygon),
          cursor: ring.length >= 2 ? (ring[ring.length - 2] ?? null) : null,
          polygon,
        })
      })
    })

    draw.on('drawend', (event) => {
      onSketchChange({ vertices: 0, areaSqm: 0, cursor: null, polygon: null })
      onPolygonChange(event.feature.getGeometry())
    })

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        draw.abortDrawing()
        onSketchChange({ vertices: 0, areaSqm: 0, cursor: null, polygon: null })
      }
      if (event.key.toLowerCase() === 'z' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        draw.removeLastPoint()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    map.addInteraction(draw)
    const snap = snapSource ? new Snap({ source: snapSource }) : null
    if (snap) map.addInteraction(snap) // snap must be added after draw

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (snap) map.removeInteraction(snap)
      map.removeInteraction(draw)
      drawRef.current = null
    }
  }, [map, source, mode, snapSource, onSketchChange, onPolygonChange])

  // Step 2: the closed polygon stays editable until saved.
  useEffect(() => {
    if (mode !== 'edit') return
    const feature = source.getFeatures()[0]
    const polygon = feature?.getGeometry()
    if (!feature || !polygon) return

    const modify = new Modify({ source })
    const onGeometryChange = () => onPolygonChange(polygon)
    polygon.on('change', onGeometryChange)
    map.addInteraction(modify)

    return () => {
      polygon.un('change', onGeometryChange)
      map.removeInteraction(modify)
    }
  }, [map, source, mode, onPolygonChange])

  const undoLastPoint = useCallback(() => {
    drawRef.current?.removeLastPoint()
  }, [])

  const clear = useCallback(() => {
    drawRef.current?.abortDrawing()
    source.clear()
  }, [source])

  return { source, undoLastPoint, clear }
}
