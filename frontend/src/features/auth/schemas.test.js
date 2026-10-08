import { describe, expect, it } from 'vitest'

import { loginSchema, registerSchema } from './schemas'

describe('registerSchema', () => {
  const valid = { name: 'Ana', email: 'ana@example.com', password: 'secret-123' }

  it('accepts valid input', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects names longer than 100 characters', () => {
    expect(registerSchema.safeParse({ ...valid, name: 'a'.repeat(101) }).success).toBe(false)
  })

  it('rejects invalid e-mails', () => {
    expect(registerSchema.safeParse({ ...valid, email: 'nope' }).success).toBe(false)
  })

  it('rejects passwords shorter than 8 characters', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'short' }).success).toBe(false)
  })

  it('rejects passwords longer than 72 characters (BCrypt limit)', () => {
    expect(
      registerSchema.safeParse({ ...valid, password: 'p'.repeat(73) }).success,
    ).toBe(false)
  })
})

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true)
  })

  it('requires both fields', () => {
    expect(loginSchema.safeParse({ email: '', password: '' }).success).toBe(false)
  })
})
