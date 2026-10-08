import { useEffect } from 'react'
import { createPortal } from 'react-dom'

import { useMapOverlay } from '@/features/map/useMapOverlay'
import { cn } from '@/shared/lib/cn'
import { formatPriceShort } from '@/shared/lib/format'
import { polygonFromGeoJson } from '@/shared/lib/geo'

/** One ol/Overlay price pill per land, anchored at the polygon's interior point. */
export function PriceLabels({ lands, selectedId, hidden, onSelect }) {
  if (hidden) return null
  return (
    <>
      {lands.map((land) => (
        <PriceLabel
          key={land.properties.id}
          land={land}
          selected={land.properties.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </>
  )
}

function PriceLabel({
  land,
  selected,
  onSelect,
}
) {
  const { container, setPosition } = useMapOverlay({ positioning: 'center-center' })

  useEffect(() => {
    const polygon = polygonFromGeoJson(land.geometry)
    setPosition(polygon.getInteriorPoint().getCoordinates())
    return () => setPosition(undefined)
  }, [land, setPosition])

  // Clicking the label is equivalent to clicking the land itself.
  return createPortal(
    <button
      type="button"
      onClick={() => onSelect(land.properties.id)}
      className={cn(
        'flex h-7 items-center rounded-full bg-surface px-2.5 text-[13px] font-semibold shadow-control',
        selected && 'bg-primary text-white',
      )}
    >
      {formatPriceShort(land.properties.price)}
    </button>,
    container,
  )
}
