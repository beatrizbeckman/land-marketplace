import { X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

import { useMapOverlay } from '@/features/map/useMapOverlay'
import { contactHref } from '@/shared/lib/contact'
import { polygonFromGeoJson } from '@/shared/lib/geo'
import {
  formatArea,
  formatLotNumber,
  formatPrice,
  formatPricePerSqm,
} from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'

/** ol/Overlay popup anchored to the selected land, with auto-pan. */
export function LandPopup({ land, onClose, onViewDetails }) {
  const { container, setPosition } = useMapOverlay({
    positioning: 'bottom-center',
    offset: [0, -14],
    autoPan: true,
  })

  useEffect(() => {
    if (!land) {
      setPosition(undefined)
      return
    }
    const polygon = polygonFromGeoJson(land.geometry)
    setPosition(polygon.getInteriorPoint().getCoordinates())
  }, [land, setPosition])

  useEffect(() => {
    if (!land) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [land, onClose])

  if (!land) return null
  const { id, price, description, contact, areaSqm } = land.properties

  return createPortal(
    <div
      role="dialog"
      aria-label={`Land ${formatLotNumber(id)}`}
      className="relative w-[300px] rounded-[12px] bg-surface p-4 shadow-popup"
    >
      <div
        aria-hidden
        className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-surface"
      />
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-2xl font-semibold leading-tight">{formatPrice(price)}</p>
          <p className="font-mono text-[11px] text-muted">{formatLotNumber(id)}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close popup"
          className="flex size-8 items-center justify-center rounded-[8px] hover:bg-surface-muted"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-[8px] bg-surface-muted p-2.5">
          <p className="text-xs text-muted">Area</p>
          <p className="text-sm font-semibold">{formatArea(areaSqm)}</p>
        </div>
        <div className="rounded-[8px] bg-surface-muted p-2.5">
          <p className="text-xs text-muted">Price per m²</p>
          <p className="text-sm font-semibold">{formatPricePerSqm(price, areaSqm)}</p>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-ink-soft">{description}</p>

      <div className="mt-3 flex gap-2">
        <Button
          size="map"
          className="flex-1"
          onClick={() => window.open(contactHref(contact), '_self')}
        >
          Contact seller
        </Button>
        <Button size="map" variant="outline" className="flex-1" onClick={onViewDetails}>
          View details
        </Button>
      </div>
    </div>,
    container,
  )
}
