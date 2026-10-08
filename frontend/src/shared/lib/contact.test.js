import { describe, expect, it } from 'vitest'

import { contactHref, isEmail, isPhone } from './contact'

describe('isEmail', () => {
  it('accepts a plain e-mail', () => {
    expect(isEmail('owner@example.com')).toBe(true)
  })

  it('rejects strings without a domain', () => {
    expect(isEmail('owner@')).toBe(false)
    expect(isEmail('not an email')).toBe(false)
  })
})

describe('isPhone', () => {
  it('accepts 10 to 15 digits with formatting characters', () => {
    expect(isPhone('+55 (61) 99999-0000')).toBe(true)
    expect(isPhone('6199990000')).toBe(true)
  })

  it('rejects too few or too many digits', () => {
    expect(isPhone('999')).toBe(false)
    expect(isPhone('1234567890123456')).toBe(false)
  })

  it('rejects letters', () => {
    expect(isPhone('call me 6199990000')).toBe(false)
  })
})

describe('contactHref', () => {
  it('builds mailto: links for e-mails', () => {
    expect(contactHref('owner@example.com')).toBe('mailto:owner@example.com')
  })

  it('builds tel: links keeping only digits and +', () => {
    expect(contactHref('+55 (61) 99999-0000')).toBe('tel:+5561999990000')
  })
})
