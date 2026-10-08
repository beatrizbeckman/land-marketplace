import { formatArea, formatPriceShort } from '@/shared/lib/format'

export const EMPTY_FILTERS = {}

export function hasActiveFilters(filters) {
  return (
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.minArea !== undefined ||
    filters.maxArea !== undefined
  )
}

/** Slider bounds derived from the loaded list, with a sane fallback when empty. */
export function priceBounds(lands) {
  if (lands.length === 0) return { min: 0, max: 1_000_000 }
  const prices = lands.map((land) => land.properties.price)
  return { min: 0, max: Math.max(...prices) }
}

export function areaBounds(lands) {
  if (lands.length === 0) return { min: 0, max: 100_000 }
  const areas = lands.map((land) => land.properties.areaSqm)
  return { min: 0, max: Math.ceil(Math.max(...areas)) }
}

/**
 * Client-side preview of how many loaded lands match a candidate range.
 * The authoritative result still comes from the API after applying.
 */
export function countMatching(
  lands,
  filters,
) {
  return lands.filter((land) => {
    const { price, areaSqm } = land.properties
    if (filters.minPrice !== undefined && price < filters.minPrice) return false
    if (filters.maxPrice !== undefined && price > filters.maxPrice) return false
    if (filters.minArea !== undefined && areaSqm < filters.minArea) return false
    if (filters.maxArea !== undefined && areaSqm > filters.maxArea) return false
    return true
  }).length
}

/** Chip label for an applied price range, e.g. "R$ 60k – 250k". */
export function priceRangeLabel(min, max) {
  return `${formatPriceShort(min)} – ${formatPriceShort(max).replace('R$ ', '')}`
}

/** Chip label for an applied area range, e.g. "8,000 m² – 1.25 ha". */
export function areaRangeLabel(min, max) {
  return `${formatArea(min)} – ${formatArea(max)}`
}
