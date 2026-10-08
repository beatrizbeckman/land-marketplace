import { ArrowLeft } from 'lucide-react'

import { contactHref } from '@/shared/lib/contact'
import {
  formatArea,
  formatLotNumber,
  formatPrice,
  formatPricePerSqm,
} from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'

import { LandThumbnail } from './LandThumbnail'

/** Full detail in the side panel, built from the already-loaded listing data. */
export function LandDetail({ land, onBack }) {
  const { id, price, description, contact, areaSqm, ownedByMe } = land.properties

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-2 border-b border-line p-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to the list"
          className="flex size-9 items-center justify-center rounded-[10px] hover:bg-surface-muted"
        >
          <ArrowLeft className="size-4" />
        </button>
        <h2 className="font-semibold">Land {formatLotNumber(id)}</h2>
        {ownedByMe && (
          <span className="ml-auto rounded-full bg-primary-tint px-2 py-0.5 text-[11px] font-semibold text-primary">
            Listed by you
          </span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <LandThumbnail geometry={land.geometry} size={160} className="mx-auto" />
        <p className="mt-4 text-[30px] font-semibold leading-tight">{formatPrice(price)}</p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-[8px] bg-surface-muted p-3">
            <p className="text-xs text-muted">Area</p>
            <p className="font-semibold">{formatArea(areaSqm)}</p>
          </div>
          <div className="rounded-[8px] bg-surface-muted p-3">
            <p className="text-xs text-muted">Price per m²</p>
            <p className="font-semibold">{formatPricePerSqm(price, areaSqm)}</p>
          </div>
        </div>

        <h3 className="mt-4 text-sm font-semibold">Description</h3>
        <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{description}</p>

        <h3 className="mt-4 text-sm font-semibold">Contact</h3>
        <p className="mt-1 font-mono text-sm text-ink-soft">{contact}</p>
      </div>

      <footer className="border-t border-line p-4">
        <Button className="w-full" onClick={() => window.open(contactHref(contact), '_self')}>
          Contact seller
        </Button>
      </footer>
    </div>
  )
}
