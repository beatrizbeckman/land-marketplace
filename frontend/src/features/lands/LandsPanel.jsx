import { X } from 'lucide-react'

import { APP_NAME } from '@/shared/config'
import { formatRadius } from '@/shared/lib/format'
import { LogoMark } from '@/shared/ui/logo'

import {
  areaBounds,
  areaRangeLabel,
  countMatching,
  hasActiveFilters,
  priceBounds,
  priceRangeLabel,
} from './filters'
import { LandDetail } from './LandDetail'
import { LandList } from './LandList'
import { RangeFilterChip } from './RangeFilterChip'

/** Floating panel over the map: list mode and land detail mode. */
export function LandsPanel({
  lands,
  isLoading,
  isError,
  onRetry,
  filters,
  onFiltersChange,
  searchRadius,
  onClearSearch,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  detailLand,
  onCloseDetail,
}) {
  const searchActive = searchRadius !== null
  const priceApplied = filters.minPrice !== undefined || filters.maxPrice !== undefined
  const areaApplied = filters.minArea !== undefined || filters.maxArea !== undefined

  return (
    <section
      aria-label="Lands panel"
      className="absolute bottom-4 left-4 top-4 z-10 flex w-[380px] flex-col overflow-hidden rounded-[14px] bg-surface shadow-panel max-md:inset-x-2 max-md:w-auto"
    >
      {detailLand ? (
        <LandDetail land={detailLand} onBack={onCloseDetail} />
      ) : (
        <>
          <header className="flex items-center gap-2 p-4 pb-3">
            <LogoMark />
            <h1 className="text-lg font-semibold">{APP_NAME}</h1>
          </header>

          <div className="flex flex-wrap gap-2 border-b border-line px-4 pb-3">
            {searchActive && (
              <span className="flex h-9 items-center gap-1.5 rounded-full bg-search-soft px-3 text-sm font-medium text-search">
                <svg aria-hidden viewBox="0 0 12 12" className="size-3">
                  <circle
                    cx="6"
                    cy="6"
                    r="5"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="2.5 2"
                  />
                </svg>
                Within {formatRadius(searchRadius)}
                <button
                  type="button"
                  aria-label="Clear search area"
                  onClick={onClearSearch}
                  className="-mr-1 flex size-5 items-center justify-center rounded-full hover:bg-search/10"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            )}
            <RangeFilterChip
              chipLabel="Price"
              title="Total price"
              inputPrefix="R$"
              bounds={priceBounds(lands)}
              applied={priceApplied ? { min: filters.minPrice, max: filters.maxPrice } : null}
              appliedLabel={
                priceApplied
                  ? priceRangeLabel(filters.minPrice ?? 0, filters.maxPrice ?? priceBounds(lands).max)
                  : null
              }
              totalCount={lands.length}
              countMatching={(range) =>
                countMatching(lands, { ...filters, minPrice: range.min, maxPrice: range.max })
              }
              onApply={(range) =>
                onFiltersChange({
                  ...filters,
                  minPrice: range?.min,
                  maxPrice: range?.max,
                })
              }
            />
            <RangeFilterChip
              chipLabel="Area"
              title="Area"
              bounds={areaBounds(lands)}
              applied={areaApplied ? { min: filters.minArea, max: filters.maxArea } : null}
              appliedLabel={
                areaApplied
                  ? areaRangeLabel(filters.minArea ?? 0, filters.maxArea ?? areaBounds(lands).max)
                  : null
              }
              totalCount={lands.length}
              countMatching={(range) =>
                countMatching(lands, { ...filters, minArea: range.min, maxArea: range.max })
              }
              onApply={(range) =>
                onFiltersChange({
                  ...filters,
                  minArea: range?.min,
                  maxArea: range?.max,
                })
              }
            />
          </div>

          <h2 className="px-4 pb-1 pt-3 text-sm font-semibold">
            {searchActive
              ? `${lands.length} lands in this area`
              : `${lands.length} lands on the map`}
          </h2>

          <LandList
            lands={lands}
            isLoading={isLoading}
            isError={isError}
            selectedId={selectedId}
            hoveredId={hoveredId}
            hasActiveFilters={hasActiveFilters(filters)}
            hasActiveSearch={searchActive}
            onRetry={onRetry}
            onSelect={(id) => onSelect(id)}
            onHover={onHover}
            onClearFilters={() => onFiltersChange({})}
            onClearSearch={onClearSearch}
          />
        </>
      )}
    </section>
  )
}
