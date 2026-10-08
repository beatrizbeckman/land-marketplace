import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'

import { makeCollection, makeLand } from './fixtures'

export const problemJson = (status, body) =>
  HttpResponse.json(
    { status, ...body },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  )

/** Default happy-path handlers mirroring the backend contract. */
export const handlers = [
  http.get('/api/lands', () =>
    HttpResponse.json(makeCollection([makeLand(1), makeLand(2, { lon: 0.01, price: 60_000 })])),
  ),
  http.get('/api/lands/search', () =>
    HttpResponse.json(makeCollection([makeLand(1)])),
  ),
  http.post('/api/lands', async ({ request }) => {
    const body = (await request.json())
    return HttpResponse.json(
      {
        type: 'Feature',
        geometry: body.geometry,
        properties: {
          id: 99,
          ...body.properties,
          areaSqm: 5_432,
          ownedByMe: true,
        },
      },
      { status: 201 },
    )
  }),
  http.post('/api/auth/register', () => new HttpResponse(null, { status: 201 })),
  http.post('/api/auth/login', () => HttpResponse.json({ token: 'test-token' })),
]

export const server = setupServer(...handlers)
