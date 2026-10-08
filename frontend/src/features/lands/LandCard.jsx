import { cn } from '@/shared/lib/cn'
import {
  formatArea,
  formatLotNumber,
  formatPrice,
  formatPricePerSqm,
} from '@/shared/lib/format'

import { LandThumbnail } from './LandThumbnail'

export function LandCard({ land, selected, hovered, onClick, onHoverChange }) {
  const { id, price, description, areaSqm, ownedByMe } = land.properties

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      aria-current={selected || undefined}
      className={cn(
        'flex w-full items-start gap-3 rounded-[10px] border border-line p-2.5 text-left',
        'transition-colors duration-150',
        hovered && !selected && 'bg-surface-muted',
        selected && 'border-primary bg-[#F3F8F5] shadow-[inset_0_0_0_1px_var(--color-primary)]',
      )}
    >
      <LandThumbnail geometry={land.geometry} selected={selected} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-[17px] font-semibold">{formatPrice(price)}</span>
          {ownedByMe ? (
            <span className="rounded-full bg-primary-tint px-2 py-0.5 text-[11px] font-semibold text-primary">
              Listed by you
            </span>
          ) : (
            <span className="font-mono text-[11px] text-muted">{formatLotNumber(id)}</span>
          )}
        </span>
        <span className="mt-0.5 block text-sm text-muted">
          {formatArea(areaSqm)} · {formatPricePerSqm(price, areaSqm)}
        </span>
        <span className="mt-0.5 block truncate text-sm text-muted">{description}</span>
      </span>
    </button>
  )
}
