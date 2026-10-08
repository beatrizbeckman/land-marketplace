import ScaleLine from 'ol/control/ScaleLine'
import { toLonLat } from 'ol/proj'
import { useEffect, useRef, useState } from 'react'

import { formatCoordinate } from '@/shared/lib/format'

import { useMapContext } from './MapContext'

/** Translucent chip with the scale bar and cursor coordinates (lon, lat). */
export function MapStatusBar() {
  const { map } = useMapContext()
  const scaleTargetRef = useRef(null)
  const [coordinate, setCoordinate] = useState(null)

  useEffect(() => {
    const target = scaleTargetRef.current
    if (!target) return
    const scaleLine = new ScaleLine({ target })
    map.addControl(scaleLine)
    return () => {
      map.removeControl(scaleLine)
    }
  }, [map])

  useEffect(() => {
    const onPointerMove = (event) => {
      setCoordinate(formatCoordinate(toLonLat(event.coordinate)))
    }
    map.on('pointermove', onPointerMove)
    return () => map.un('pointermove', onPointerMove)
  }, [map])

  return (
    <div className="pointer-events-none absolute bottom-4 left-[412px] z-10 flex items-center gap-3 rounded-[10px] bg-surface/85 px-3 py-1.5 shadow-control max-lg:left-4">
      <div ref={scaleTargetRef} className="[&_.ol-scale-line]:static [&_.ol-scale-line]:bg-transparent [&_.ol-scale-line-inner]:border-ink [&_.ol-scale-line-inner]:text-ink [&_.ol-scale-line-inner]:text-xs" />
      <span className="font-mono text-xs text-ink-soft">{coordinate ?? '—'}</span>
    </div>
  )
}
