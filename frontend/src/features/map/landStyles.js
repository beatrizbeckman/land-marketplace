import MultiPoint from 'ol/geom/MultiPoint'
import Polygon from 'ol/geom/Polygon'
import CircleStyle from 'ol/style/Circle'
import Fill from 'ol/style/Fill'
import Stroke from 'ol/style/Stroke'
import Style from 'ol/style/Style'

const PRIMARY = [22, 101, 52]
const INK = [16, 32, 26]
const DANGER = [180, 35, 24]

function rgba(color, alpha) {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`
}

export function landStyle(flags) {
  const styles = []

  if (flags.selected) {
    // White halo 6px outside the 3px primary stroke.
    styles.push(new Style({ stroke: new Stroke({ color: 'white', width: 3 + 6 * 2 }) }))
    styles.push(
      new Style({
        fill: new Fill({ color: rgba(PRIMARY, 0.45) }),
        stroke: new Stroke({ color: rgba(PRIMARY, 1), width: 3 }),
      }),
    )
    return styles
  }

  if (flags.dimmed) {
    styles.push(
      new Style({
        fill: new Fill({ color: rgba(PRIMARY, 0.14) }),
        stroke: new Stroke({ color: rgba(PRIMARY, 0.55), width: 2 }),
      }),
    )
  } else {
    if (flags.satelliteHalo) {
      styles.push(new Style({ stroke: new Stroke({ color: 'white', width: 2 + 2 * 2 }) }))
    }
    styles.push(
      new Style({
        fill: new Fill({ color: rgba(PRIMARY, 0.22) }),
        stroke: new Stroke({
          color: rgba(PRIMARY, 1),
          width: flags.hovered ? 3 : 2,
        }),
      }),
    )
  }

  if (flags.conflict) {
    styles.push(new Style({ stroke: new Stroke({ color: rgba(INK, 1), width: 2.5 }) }))
  }

  return styles
}

let hatchPattern = null

/** Diagonal danger hatch for an invalid (overlapping) draft. */
function getHatchPattern() {
  if (hatchPattern) return hatchPattern
  const canvas = document.createElement('canvas')
  canvas.width = 8
  canvas.height = 8
  const ctx = canvas.getContext('2d')
  if (!ctx) return rgba(DANGER, 0.18) // canvas unavailable (tests): flat fallback
  ctx.strokeStyle = rgba(DANGER, 0.55)
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(-2, 10)
  ctx.lineTo(10, -2)
  ctx.stroke()
  const pattern = ctx.createPattern(canvas, 'repeat')
  if (!pattern) return rgba(DANGER, 0.18)
  hatchPattern = pattern
  return pattern
}

function ringVertices(feature) {
  const geometry = feature.getGeometry()
  if (geometry instanceof Polygon) {
    const ring = geometry.getCoordinates()[0] ?? []
    return new MultiPoint(ring.slice(0, Math.max(ring.length - 1, 0)))
  }
  return new MultiPoint([])
}

/**
 * Style for the polygon draft, both while sketching and while editing.
 * Valid: primary fill with white vertex handles; invalid: danger hatch.
 */
export function draftStyle(invalid) {
  const color = invalid ? DANGER : PRIMARY
  return (feature) => [
    new Style({
      fill: new Fill({ color: invalid ? getHatchPattern() : rgba(PRIMARY, 0.24) }),
      stroke: new Stroke({ color: rgba(color, 1), width: 2.5 }),
    }),
    new Style({
      geometry: ringVertices(feature),
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({ color: 'white' }),
        stroke: new Stroke({ color: rgba(color, 1), width: 2 }),
      }),
    }),
  ]
}
