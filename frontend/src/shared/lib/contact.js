const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_ALLOWED_CHARS = /^[+\d\s()-]+$/

export function isEmail(value) {
  return EMAIL_PATTERN.test(value.trim())
}

/** Phone with 10 to 15 digits; +, spaces, parentheses and hyphens are allowed. */
export function isPhone(value) {
  const trimmed = value.trim()
  if (!PHONE_ALLOWED_CHARS.test(trimmed)) return false
  const digits = trimmed.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

/** "Contact seller" target: mailto: for e-mails, tel: for phone numbers. */
export function contactHref(contact) {
  if (isEmail(contact)) return `mailto:${contact.trim()}`
  return `tel:${contact.replace(/[^+\d]/g, '')}`
}
