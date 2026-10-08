import { request } from '@/shared/lib/http'

function appendFilters(params, filters) {
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice))
  if (filters.minArea !== undefined) params.set('minArea', String(filters.minArea))
  if (filters.maxArea !== undefined) params.set('maxArea', String(filters.maxArea))
}

export function fetchLandsByBbox(
  bbox,
  filters,
  signal,
) {
  const params = new URLSearchParams({ bbox: bbox.join(',') })
  appendFilters(params, filters)
  return request(`/lands?${params}`, { signal, anonymousRetryOn401: true })
}

export function searchLandsByCircle(
  search,
  filters,
  signal,
) {
  if (search.radius <= 0) {
    return Promise.reject(new Error('radius must be greater than 0'))
  }
  const params = new URLSearchParams({
    lon: String(search.lon),
    lat: String(search.lat),
    radius: String(search.radius),
  })
  appendFilters(params, filters)
  return request(`/lands/search?${params}`, {
    signal,
    anonymousRetryOn401: true,
  })
}

export function createLand(input) {
  return request('/lands', {
    method: 'POST',
    body: {
      type: 'Feature',
      geometry: input.geometry,
      properties: {
        price: input.price,
        description: input.description,
        contact: input.contact,
      },
    },
  })
}
