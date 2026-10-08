import { useEffect } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/shared/lib/cn'

import { useMapOverlay } from './useMapOverlay'

/** Small pill overlay (area label, radius label, conflict chip) pinned to a coordinate. */
export function MapChip({
  coordinate,
  children,
  className,
  positioning = 'center-left',
  offset = [12, 0],
}) {
  const { container, setPosition } = useMapOverlay({ positioning, offset })

  useEffect(() => {
    setPosition(coordinate ?? undefined)
  }, [coordinate, setPosition])

  if (!coordinate) return null

  return createPortal(
    <span
      className={cn(
        'pointer-events-none flex h-7 items-center whitespace-nowrap rounded-full px-2.5 font-mono text-xs font-medium text-white shadow-control',
        className,
      )}
    >
      {children}
    </span>,
    container,
  )
}
