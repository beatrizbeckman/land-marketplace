import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/test/server'
import { makeCollection, makeLand, squarePolygon } from '@/test/fixtures'

import { createLand, fetchLandsByBbox, searchLandsByCircle } from './api'

describe('fetchLandsByBbox', () => {
  it('sends the bbox and only the defined filters', async () => {
    let url = null
    server.use(
      http.get('/api/lands', ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(makeCollection([makeLand(1)]))
      }),
    )

    await fetchLandsByBbox([-48, -16, -47, -15], { minPrice: 1000, maxArea: 50_000 })
    expect(url.searchParams.get('bbox')).toBe('-48,-16,-47,-15')
    expect(url.searchParams.get('minPrice')).toBe('1000')
    expect(url.searchParams.get('maxArea')).toBe('50000')
    expect(url.searchParams.has('maxPrice')).toBe(false)
    expect(url.searchParams.has('minArea')).toBe(false)
  })
})

describe('searchLandsByCircle', () => {
  it('sends lon, lat and radius in meters', async () => {
    let url = null
    server.use(
      http.get('/api/lands/search', ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(makeCollection([]))
      }),
    )

    await searchLandsByCircle({ lon: -47.9, lat: -15.8, radius: 2400 }, { maxPrice: 9 })
    expect(url.searchParams.get('lon')).toBe('-47.9')
    expect(url.searchParams.get('lat')).toBe('-15.8')
    expect(url.searchParams.get('radius')).toBe('2400')
    expect(url.searchParams.get('maxPrice')).toBe('9')
  })

  it('rejects locally when radius is not positive, without calling the API', async () => {
    await expect(
      searchLandsByCircle({ lon: 0, lat: 0, radius: 0 }, {}),
    ).rejects.toThrow('radius must be greater than 0')
  })
})

describe('createLand', () => {
  it('posts a GeoJSON Feature and returns the created land', async () => {
    let body = null
    server.use(
      http.post('/api/lands', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(makeLand(99, { ownedByMe: true }), { status: 201 })
      }),
    )

    const created = await createLand({
      geometry: squarePolygon(0, 0),
      price: 185_000,
      description: 'Flat land close to the river.',
      contact: 'owner@example.com',
    })

    expect(body).toMatchObject({
      type: 'Feature',
      properties: { price: 185_000, contact: 'owner@example.com' },
    })
    expect(created.properties.id).toBe(99)
    expect(created.properties.ownedByMe).toBe(true)
  })
})
