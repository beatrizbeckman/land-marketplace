import { describe, expect, it } from 'vitest'

import {
  formatArea,
  formatCoordinate,
  formatLotNumber,
  formatPrice,
  formatPricePerSqm,
  formatPriceShort,
  formatRadius,
  initialsOf,
} from './format'

describe('formatPrice', () => {
  it('hides cents when they are zero', () => {
    expect(formatPrice(185_000)).toBe('R$ 185,000')
  })

  it('shows two decimals when there are cents', () => {
    expect(formatPrice(185_000.5)).toBe('R$ 185,000.50')
  })

  it('handles small values', () => {
    expect(formatPrice(950)).toBe('R$ 950')
  })
})

describe('formatPriceShort', () => {
  it('uses k above one thousand', () => {
    expect(formatPriceShort(185_000)).toBe('R$ 185k')
  })

  it('uses M with one decimal above one million', () => {
    expect(formatPriceShort(1_200_000)).toBe('R$ 1.2M')
  })

  it('drops the trailing .0 for round millions', () => {
    expect(formatPriceShort(2_000_000)).toBe('R$ 2M')
  })

  it('keeps plain values below one thousand', () => {
    expect(formatPriceShort(950)).toBe('R$ 950')
  })
})

describe('formatArea', () => {
  it('uses m² below one hectare', () => {
    expect(formatArea(8_000)).toBe('8,000 m²')
  })

  it('uses hectares with two decimals from 10,000 m²', () => {
    expect(formatArea(12_500)).toBe('1.25 ha')
  })

  it('rounds m² to integers', () => {
    expect(formatArea(999.6)).toBe('1,000 m²')
  })
})

describe('formatPricePerSqm', () => {
  it('always shows two decimals', () => {
    expect(formatPricePerSqm(185_000, 12_483)).toBe('R$ 14.82/m²')
  })
})

describe('formatRadius', () => {
  it('uses meters below 1 km', () => {
    expect(formatRadius(180.4)).toBe('180 m')
  })

  it('uses km with one decimal above 1 km', () => {
    expect(formatRadius(2_400)).toBe('2.4 km')
  })
})

describe('formatLotNumber', () => {
  it('pads the id to three digits', () => {
    expect(formatLotNumber(14)).toBe('Nº 014')
  })

  it('keeps longer ids intact', () => {
    expect(formatLotNumber(1234)).toBe('Nº 1234')
  })
})

describe('formatCoordinate', () => {
  it('shows lon, lat with five decimals', () => {
    expect(formatCoordinate([-47.123456, -15.9])).toBe('-47.12346, -15.90000')
  })
})

describe('initialsOf', () => {
  it('takes the first letters of the first two words', () => {
    expect(initialsOf('Marina Silva')).toBe('MS')
  })

  it('splits e-mail local parts on dots', () => {
    expect(initialsOf('ana.souza')).toBe('AS')
  })

  it('uses the first two letters of a single word', () => {
    expect(initialsOf('marina')).toBe('MA')
  })

  it('falls back to a question mark when empty', () => {
    expect(initialsOf('')).toBe('?')
  })
})
