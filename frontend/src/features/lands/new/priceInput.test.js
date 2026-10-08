import { describe, expect, it } from 'vitest'

import { isValidPriceInput, maskPriceInput, priceInputToNumber } from './priceInput'

describe('maskPriceInput', () => {
  it('groups thousands with commas', () => {
    expect(maskPriceInput('185000')).toBe('185,000')
  })

  it('keeps up to two decimals after the first dot', () => {
    expect(maskPriceInput('185000.509')).toBe('185,000.50')
  })

  it('drops everything that is not a digit or a dot', () => {
    expect(maskPriceInput('R$ 1a2b3')).toBe('123')
  })

  it('keeps only the first dot', () => {
    expect(maskPriceInput('1.2.3')).toBe('1.23')
  })

  it('limits the integer part to 12 digits', () => {
    expect(maskPriceInput('12345678901234')).toBe('123,456,789,012')
  })

  it('strips leading zeros', () => {
    expect(maskPriceInput('0005')).toBe('5')
  })
})

describe('priceInputToNumber', () => {
  it('parses the masked value', () => {
    expect(priceInputToNumber('185,000.50')).toBe(185_000.5)
  })
})

describe('isValidPriceInput (backend rules)', () => {
  it('accepts integers and up to 2 decimals', () => {
    expect(isValidPriceInput('185,000')).toBe(true)
    expect(isValidPriceInput('185,000.55')).toBe(true)
  })

  it('rejects zero and empty values', () => {
    expect(isValidPriceInput('0')).toBe(false)
    expect(isValidPriceInput('')).toBe(false)
  })

  it('rejects more than 2 decimals or more than 12 integer digits', () => {
    expect(isValidPriceInput('1.234')).toBe(false)
    expect(isValidPriceInput('1234567890123')).toBe(false)
  })
})
