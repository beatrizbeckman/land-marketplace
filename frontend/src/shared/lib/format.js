const integerFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const twoDecimalsFormat = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const SQM_PER_HECTARE = 10_000

/** "R$ 185,000" without cents when they are zero, "R$ 185,000.50" otherwise. */
export function formatPrice(price) {
  const cents = Math.round(price * 100) % 100
  const format = cents === 0 ? integerFormat : twoDecimalsFormat
  return `R$ ${format.format(price)}`
}

/** Short price for map labels: "R$ 950", "R$ 185k", "R$ 1.2M". */
export function formatPriceShort(price) {
  if (price >= 1_000_000) {
    const millions = (price / 1_000_000).toFixed(1).replace(/\.0$/, '')
    return `R$ ${millions}M`
  }
  if (price >= 1_000) {
    return `R$ ${Math.round(price / 1_000)}k`
  }
  return `R$ ${integerFormat.format(Math.round(price))}`
}

/** "8,000 m²" below one hectare threshold (10,000 m²), "1.25 ha" above. */
export function formatArea(areaSqm) {
  if (areaSqm < SQM_PER_HECTARE) {
    return `${integerFormat.format(Math.round(areaSqm))} m²`
  }
  return `${(areaSqm / SQM_PER_HECTARE).toFixed(2)} ha`
}

/** "R$ 14.82/m²", always two decimals. */
export function formatPricePerSqm(price, areaSqm) {
  return `R$ ${twoDecimalsFormat.format(price / areaSqm)}/m²`
}

/** "180 m" below 1 km, "2.4 km" above. */
export function formatRadius(radiusMeters) {
  if (radiusMeters < 1_000) {
    return `${Math.round(radiusMeters)} m`
  }
  return `${(radiusMeters / 1_000).toFixed(1)} km`
}

/** "Nº 014": land id padded to three digits (presentation only, id comes from the API). */
export function formatLotNumber(id) {
  return `Nº ${String(id).padStart(3, '0')}`
}

/** "lon, lat" with five decimal places for the map footer. */
export function formatCoordinate(lonLat) {
  const [lon, lat] = lonLat
  return `${(lon ?? 0).toFixed(5)}, ${(lat ?? 0).toFixed(5)}`
}

/** Initials for the signed-in pill, e.g. "ana.silva" -> "AS", "Ana Silva" -> "AS". */
export function initialsOf(name) {
  const words = name.split(/[\s._@-]+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}
