/**
 * SVG path of the polygon's outer ring normalized to fit a square viewBox,
 * preserving aspect ratio. Latitude grows up, SVG y grows down, so y is flipped.
 */
export function polygonToSvgPath(geometry, size, padding = 4) {
  const ring = geometry.coordinates[0]
  if (!ring || ring.length < 3) return ''

  const lons = ring.map(([lon]) => lon ?? 0)
  const lats = ring.map(([, lat]) => lat ?? 0)
  const minLon = Math.min(...lons)
  const maxLon = Math.max(...lons)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)

  const width = maxLon - minLon || 1
  const height = maxLat - minLat || 1
  const scale = (size - padding * 2) / Math.max(width, height)
  const offsetX = (size - width * scale) / 2
  const offsetY = (size - height * scale) / 2

  const points = ring.map(([lon, lat]) => {
    const x = offsetX + ((lon ?? 0) - minLon) * scale
    const y = size - offsetY - ((lat ?? 0) - minLat) * scale
    return `${x.toFixed(1)} ${y.toFixed(1)}`
  })

  return `M ${points.join(' L ')} Z`
}
