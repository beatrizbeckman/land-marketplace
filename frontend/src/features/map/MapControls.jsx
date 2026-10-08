import { Minus, Plus } from 'lucide-react'

import { cn } from '@/shared/lib/cn'

import { BASE_LAYERS } from './baseLayers'
import { useMapContext } from './MapContext'

/** Zoom buttons, base layer switcher and layer attribution (bottom right). */
export function MapControls() {
  const { map, baseLayer, setBaseLayer } = useMapContext()

  const zoomBy = (delta) => {
    const view = map.getView()
    const zoom = view.getZoom()
    if (zoom === undefined) return
    view.animate({ zoom: zoom + delta, duration: 150 })
  }

  const active = BASE_LAYERS.find((layer) => layer.key === baseLayer)

  return (
    <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
      <div className="flex flex-col overflow-hidden rounded-[12px] bg-surface shadow-control">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => zoomBy(1)}
          className="flex size-11 items-center justify-center hover:bg-surface-muted"
        >
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => zoomBy(-1)}
          className="flex size-11 items-center justify-center border-t border-line hover:bg-surface-muted"
        >
          <Minus className="size-4" />
        </button>
      </div>

      <div className="flex gap-1.5 rounded-[12px] bg-surface p-1.5 shadow-control">
        {BASE_LAYERS.map((layer) => (
          <button
            key={layer.key}
            type="button"
            onClick={() => setBaseLayer(layer.key)}
            aria-pressed={baseLayer === layer.key}
            className="flex flex-col items-center gap-1"
          >
            <img
              src={layer.thumbnailUrl}
              alt=""
              loading="lazy"
              className={cn(
                'h-10 w-14 rounded-[8px] border-2 border-transparent object-cover',
                baseLayer === layer.key && 'border-primary',
              )}
            />
            <span
              className={cn(
                'text-[11px] text-muted-strong',
                baseLayer === layer.key && 'font-semibold text-ink',
              )}
            >
              {layer.label}
            </span>
          </button>
        ))}
      </div>

      <p className="max-w-56 text-right text-[10px] leading-tight text-ink-soft [text-shadow:0_0_2px_white]">
        {active?.attribution}
      </p>
    </div>
  )
}
