import { describe, expect, it } from 'vitest'

import { landFormSchema } from './landFormSchema'

const valid = {
  price: '185,000.50',
  description: 'Flat land close to the river, ready to build.',
  contact: 'owner@example.com',
}

describe('landFormSchema', () => {
  it('accepts a valid form', () => {
    expect(landFormSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts a phone contact', () => {
    const result = landFormSchema.safeParse({ ...valid, contact: '+55 (61) 99999-0000' })
    expect(result.success).toBe(true)
  })

  it('rejects an empty price', () => {
    const result = landFormSchema.safeParse({ ...valid, price: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a price with more than 2 decimals', () => {
    expect(landFormSchema.safeParse({ ...valid, price: '10.555' }).success).toBe(false)
  })

  it('rejects descriptions shorter than 10 characters', () => {
    expect(landFormSchema.safeParse({ ...valid, description: 'too short' }).success).toBe(false)
  })

  it('rejects descriptions longer than 500 characters', () => {
    const description = 'x'.repeat(501)
    expect(landFormSchema.safeParse({ ...valid, description }).success).toBe(false)
  })

  it('rejects contacts that are neither e-mail nor phone', () => {
    expect(landFormSchema.safeParse({ ...valid, contact: 'ask my neighbor' }).success).toBe(false)
  })

  it('rejects contacts longer than 255 characters', () => {
    const contact = `${'a'.repeat(250)}@example.com`
    expect(landFormSchema.safeParse({ ...valid, contact }).success).toBe(false)
  })
})
