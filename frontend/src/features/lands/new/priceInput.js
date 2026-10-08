/**
 * Currency mask for the BRL price field, matching the display format of the
 * rest of the app ("R$ 185,000.50"): comma thousand separators, dot decimals.
 */
export function maskPriceInput(raw) {
  // Keep digits and the first dot only.
  let cleaned = raw.replace(/[^\d.]/g, '')
  const firstDot = cleaned.indexOf('.')
  if (firstDot !== -1) {
    cleaned =
      cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
  }

  let [integer = '', decimals] = cleaned.split('.')
  integer = integer.replace(/^0+(?=\d)/, '').slice(0, 12)
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  if (decimals === undefined) return grouped
  return `${grouped}.${decimals.slice(0, 2)}`
}

/** Parses the masked value back to a number ("185,000.5" -> 185000.5). */
export function priceInputToNumber(masked) {
  return Number(masked.replace(/,/g, ''))
}

/** Backend rule: required, > 0, up to 2 decimal places, up to 12 integer digits. */
export function isValidPriceInput(masked) {
  const plain = masked.replace(/,/g, '')
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(plain)) return false
  return Number(plain) > 0
}
