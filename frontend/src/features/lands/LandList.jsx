import { TriangleAlert } from 'lucide-react'

import { Button } from '@/shared/ui/button'

import { LandCard } from './LandCard'

export function LandList({
  lands,
  isLoading,
  isError,
  selectedId,
  hoveredId,
  hasActiveFilters,
  hasActiveSearch,
  onRetry,
  onSelect,
  onHover,
  onClearFilters,
  onClearSearch,
}) {
  if (isLoading) {
    return (
      <div data-testid="lands-skeleton" className="flex flex-col gap-2 p-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex gap-3 rounded-[10px] bg-[#F0F2F0] p-2.5">
            <div className="size-14 rounded-[8px] bg-[#E9ECE9]" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3.5 w-2/5 rounded bg-[#E9ECE9]" />
              <div className="h-3 w-3/5 rounded bg-[#E9ECE9]" />
              <div className="h-3 w-4/5 rounded bg-[#E9ECE9]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <TriangleAlert aria-hidden className="size-8 text-danger" />
        <h3 className="font-semibold">Couldn&apos;t load the lands</h3>
        <p className="text-sm text-muted">Something went wrong while fetching the data.</p>
        <Button size="map" onClick={onRetry}>
          Try again
        </Button>
      </div>
    )
  }

  if (lands.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <svg aria-hidden viewBox="0 0 48 32" className="h-8 w-12 stroke-muted" fill="none">
          <path d="M6 26 14 6l10 8 10-10 8 22Z" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        <h3 className="font-semibold">No lands in this area</h3>
        <p className="text-sm text-muted">
          Move the map, widen the search circle or relax the filters to see more lands.
        </p>
        <div className="flex gap-2">
          {hasActiveFilters && (
            <Button size="map" onClick={onClearFilters}>
              Clear filters
            </Button>
          )}
          {hasActiveSearch && (
            <Button size="map" variant="outline" onClick={onClearSearch}>
              Clear search area
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-2 overflow-y-auto p-4" onMouseLeave={() => onHover(null)}>
      {lands.map((land) => (
        <li key={land.properties.id}>
          <LandCard
            land={land}
            selected={selectedId === land.properties.id}
            hovered={hoveredId === land.properties.id}
            onClick={() => onSelect(land.properties.id)}
            onHoverChange={(hovering) => onHover(hovering ? land.properties.id : null)}
          />
        </li>
      ))}
    </ul>
  )
}
