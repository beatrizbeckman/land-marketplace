import CircleGeometry from 'ol/geom/Circle'
import { fromLonLat } from 'ol/proj'
import { describe, expect, it } from 'vitest'

import { makeLand, squarePolygon } from '@/test/fixtures'

import {
  circleRadiusMeters,
  distanceMeters,
  extentToLonLatBbox,
  findOverlappingLand,
  interiorsOverlap,
  polygonAreaSqm,
  polygonFromGeoJson,
  polygonToGeoJson,
  polygonVertexCount,
} from './geo'

describe('GeoJSON conversion', () => {
  it('round-trips a polygon between EPSG:4326 and EPSG:3857', () => {
    const original = squarePolygon(-47.9, -15.8)
    const polygon = polygonFromGeoJson(original)
    const back = polygonToGeoJson(polygon)
    const ring = back.coordinates[0]
    expect(ring[0][0]).toBeCloseTo(-47.9, 6)
    expect(ring[0][1]).toBeCloseTo(-15.8, 6)
    expect(ring).toHaveLength(5)
  })
})

describe('polygonAreaSqm', () => {
  it('approximates the spherical area of a ~111m square at the equator', () => {
    const polygon = polygonFromGeoJson(squarePolygon(0, 0, 0.001))
    const area = polygonAreaSqm(polygon)
    // 0.001° ≈ 111.3 m at the equator → ~12,390 m².
    expect(area).toBeGreaterThan(11_000)
    expect(area).toBeLessThan(13_500)
  })
})

describe('polygonVertexCount', () => {
  it('ignores the closing coordinate', () => {
    const polygon = polygonFromGeoJson(squarePolygon(0, 0))
    expect(polygonVertexCount(polygon)).toBe(4)
  })
})

describe('circleRadiusMeters', () => {
  it('matches the geodesic distance at the equator', () => {
    const center = fromLonLat([0, 0])
    const edge = fromLonLat([0.001, 0])
    const circle = new CircleGeometry(center, edge[0] - center[0])
    expect(circleRadiusMeters(circle)).toBeCloseTo(distanceMeters(center, edge), 6)
  })

  it('corrects the Web Mercator latitude distortion', () => {
    // Same projected radius at latitude 60° covers about half the real meters.
    const atEquator = new CircleGeometry(fromLonLat([0, 0]), 1_000)
    const atLat60 = new CircleGeometry(fromLonLat([0, 60]), 1_000)
    const ratio = circleRadiusMeters(atLat60) / circleRadiusMeters(atEquator)
    expect(ratio).toBeGreaterThan(0.45)
    expect(ratio).toBeLessThan(0.55)
  })
})

describe('extentToLonLatBbox', () => {
  it('converts a view extent to a lon/lat bbox', () => {
    const min = fromLonLat([-48, -16])
    const max = fromLonLat([-47, -15])
    const bbox = extentToLonLatBbox([min[0], min[1], max[0], max[1]])
    expect(bbox[0]).toBeCloseTo(-48, 5)
    expect(bbox[1]).toBeCloseTo(-16, 5)
    expect(bbox[2]).toBeCloseTo(-47, 5)
    expect(bbox[3]).toBeCloseTo(-15, 5)
  })
})

describe('interiorsOverlap (mirrors ST_Relate 2********)', () => {
  it('detects a genuine interior overlap', () => {
    const a = squarePolygon(0, 0, 0.001)
    const b = squarePolygon(0.0005, 0.0005, 0.001)
    expect(interiorsOverlap(a, b)).toBe(true)
  })

  it('allows polygons that only share an edge', () => {
    const a = squarePolygon(0, 0, 0.001)
    const b = squarePolygon(0.001, 0, 0.001) // touches the east edge exactly
    expect(interiorsOverlap(a, b)).toBe(false)
  })

  it('allows polygons that only share a vertex', () => {
    const a = squarePolygon(0, 0, 0.001)
    const b = squarePolygon(0.001, 0.001, 0.001) // touches at one corner
    expect(interiorsOverlap(a, b)).toBe(false)
  })

  it('detects full containment as a conflict', () => {
    const outer = squarePolygon(0, 0, 0.002)
    const inner = squarePolygon(0.0005, 0.0005, 0.0005)
    expect(interiorsOverlap(inner, outer)).toBe(true)
  })

  it('returns false for disjoint polygons', () => {
    const a = squarePolygon(0, 0, 0.001)
    const b = squarePolygon(0.01, 0.01, 0.001)
    expect(interiorsOverlap(a, b)).toBe(false)
  })
})

describe('findOverlappingLand', () => {
  it('returns the first conflicting land', () => {
    const lands = [makeLand(1), makeLand(2, { lon: 0.01 })]
    const draft = squarePolygon(0.0005, 0.0005, 0.001)
    expect(findOverlappingLand(draft, lands)?.properties.id).toBe(1)
  })

  it('returns null when the draft only touches boundaries', () => {
    const lands = [makeLand(1)]
    const draft = squarePolygon(0.001, 0, 0.001)
    expect(findOverlappingLand(draft, lands)).toBeNull()
  })
})
