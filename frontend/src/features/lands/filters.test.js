import { describe, expect, it } from 'vitest'

import { makeLand } from '@/test/fixtures'

import {
  areaBounds,
  areaRangeLabel,
  countMatching,
  hasActiveFilters,
  priceBounds,
  priceRangeLabel,
} from './filters'

const lands = [
  makeLand(1, { price: 60_000, areaSqm: 8_000 }),
  makeLand(2, { price: 185_000, areaSqm: 12_500 }),
  makeLand(3, { price: 250_000, areaSqm: 30_000 }),
]

describe('hasActiveFilters', () => {
  it('is false for empty filters', () => {
    expect(hasActiveFilters({})).toBe(false)
  })

  it('is true when any bound is set', () => {
    expect(hasActiveFilters({ minPrice: 1 })).toBe(true)
    expect(hasActiveFilters({ maxArea: 10 })).toBe(true)
  })
})

describe('bounds', () => {
  it('derives price bounds from the loaded lands', () => {
    expect(priceBounds(lands)).toEqual({ min: 0, max: 250_000 })
  })

  it('derives area bounds from the loaded lands', () => {
    expect(areaBounds(lands)).toEqual({ min: 0, max: 30_000 })
  })

  it('falls back to defaults when the list is empty', () => {
    expect(priceBounds([]).max).toBe(1_000_000)
    expect(areaBounds([]).max).toBe(100_000)
  })
})

describe('countMatching', () => {
  it('counts lands inside the price range', () => {
    expect(countMatching(lands, { minPrice: 100_000, maxPrice: 200_000 })).toBe(1)
  })

  it('combines price and area bounds', () => {
    expect(countMatching(lands, { minPrice: 100_000, minArea: 20_000 })).toBe(1)
  })

  it('counts everything with no filters', () => {
    expect(countMatching(lands, {})).toBe(3)
  })
})

describe('range labels', () => {
  it('formats the price chip label', () => {
    expect(priceRangeLabel(60_000, 250_000)).toBe('R$ 60k – 250k')
  })

  it('formats the area chip label', () => {
    expect(areaRangeLabel(8_000, 12_500)).toBe('8,000 m² – 1.25 ha')
  })
})
