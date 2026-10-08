import { cn } from '@/shared/lib/cn'

import { polygonToSvgPath } from './thumbnail'

/** Miniature of the land outline on a muted square. */
export function LandThumbnail({
  geometry,
  size = 56,
  selected = false,
  danger = false,
  className,
}) {
  return (
    <svg
      role="img"
      aria-label="Land outline"
      viewBox={`0 0 ${size} ${size}`}
      className={cn('shrink-0 rounded-[8px] bg-surface-muted', className)}
      style={{ width: size, height: size }}
    >
      <path
        d={polygonToSvgPath(geometry, size)}
        className={cn(
          'fill-[#CFE2D6] stroke-primary stroke-2',
          selected && 'fill-[#9FC4AC]',
          danger && 'fill-danger-soft stroke-danger',
        )}
        strokeLinejoin="round"
      />
    </svg>
  )
}
