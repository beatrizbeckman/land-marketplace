import { area as turfArea } from '@turf/area'
import { featureCollection, feature as turfFeature } from '@turf/helpers'
import { intersect } from '@turf/intersect'
import GeoJSON from 'ol/format/GeoJSON'
import { toLonLat, transformExtent } from 'ol/proj'
import { getArea as getSphericalArea, getDistance } from 'ol/sphere'

/**
 * Converts between the API projection (EPSG:4326, what PostGIS stores) and the
 * map view projection (EPSG:3857, what OpenLayers renders).
 */
export const geoJson = new GeoJSON({
  dataProjection: 'EPSG:4326',
  featureProjection: 'EPSG:3857',
})

/** Serializes a map polygon (EPSG:3857) to a GeoJSON Polygon in EPSG:4326. */
export function polygonToGeoJson(polygon) {
  return geoJson.writeGeometryObject(polygon)
}

/** Reads a GeoJSON Polygon (EPSG:4326) into a map polygon (EPSG:3857). */
export function polygonFromGeoJson(geometry) {
  return geoJson.readGeometry(geometry)
}

/**
 * Spherical area in m² of a polygon in view coordinates. This is only a live
 * preview while drawing; after saving, the backend-computed areaSqm is shown.
 */
export function polygonAreaSqm(polygon) {
  return getSphericalArea(polygon)
}

/** Number of fixed vertices in the polygon's outer ring (ignores the closing coordinate). */
export function polygonVertexCount(polygon) {
  const ring = polygon.getCoordinates()[0]
  if (!ring || ring.length < 2) return ring?.length ?? 0
  return ring.length - 1
}

/**
 * Real radius in meters of a circle drawn in EPSG:3857.
 *
 * circle.getRadius() is in projected map units, which stretch with latitude
 * (Web Mercator distortion). The backend runs ST_DWithin over geography and
 * expects meters on the spheroid, so we measure the geodesic distance between
 * the center and a point on the edge, both converted to lon/lat.
 */
export function circleRadiusMeters(circle) {
  const center = circle.getCenter()
  const edge = [center[0] + circle.getRadius(), center[1]]
  return getDistance(toLonLat(center), toLonLat(edge))
}

/** Geodesic distance in meters between two EPSG:3857 coordinates. */
export function distanceMeters(a, b) {
  return getDistance(toLonLat(a), toLonLat(b))
}

/** View extent (EPSG:3857) as a lon/lat bounding box: [minLon, minLat, maxLon, maxLat]. */
export function extentToLonLatBbox(extent) {
  const [minLon, minLat, maxLon, maxLat] = transformExtent(extent, 'EPSG:3857', 'EPSG:4326')
  return [
    round6(minLon),
    round6(minLat),
    round6(maxLon),
    round6(maxLat),
  ]
}

function round6(value) {
  return Math.round(value * 1e6) / 1e6
}

/**
 * Area in m² below which an intersection is treated as numeric noise rather
 * than a genuine shared interior.
 */
const OVERLAP_EPSILON_SQM = 1e-6

/**
 * True when the interiors of two polygons share area, mirroring the backend's
 * ST_Relate '2********' rule: touching an edge or a vertex is NOT a conflict,
 * only a 2-dimensional (area) intersection is.
 */
export function interiorsOverlap(a, b) {
  const intersection = intersect(featureCollection([turfFeature(a), turfFeature(b)]))
  if (!intersection) return false
  return turfArea(intersection) > OVERLAP_EPSILON_SQM
}

/**
 * First land whose interior overlaps the draft, or null. Pre-check only: the
 * authoritative validation is the backend's PostGIS query (409 on conflict).
 */
export function findOverlappingLand(
  draft,
  lands,
) {
  return lands.find((land) => interiorsOverlap(draft, land.geometry)) ?? null
}
