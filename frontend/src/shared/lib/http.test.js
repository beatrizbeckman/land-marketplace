import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { server, problemJson } from '@/test/server'

import { ApiError, request, UnauthorizedError } from './http'
import { TOKEN_CLEARED_EVENT, tokenStorage } from './token'

describe('request', () => {
  it('parses JSON responses', async () => {
    server.use(http.get('/api/ping', () => HttpResponse.json({ ok: true })))
    await expect(request('/ping')).resolves.toEqual({ ok: true })
  })

  it('returns undefined for empty bodies (201 register)', async () => {
    server.use(http.post('/api/empty', () => new HttpResponse(null, { status: 201 })))
    await expect(request('/empty', { method: 'POST', body: {} })).resolves.toBeUndefined()
  })

  it('sends the Authorization header when a token is stored', async () => {
    tokenStorage.set('my-token')
    let seen = null
    server.use(
      http.get('/api/ping', ({ request: req }) => {
        seen = req.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      }),
    )
    await request('/ping')
    expect(seen).toBe('Bearer my-token')
  })

  it('throws ApiError with the Problem Details payload', async () => {
    server.use(
      http.get('/api/bad', () => problemJson(400, { detail: 'bbox must have 4 numbers' })),
    )
    const error = await request('/bad').catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error).status).toBe(400)
    expect((error).problem.detail).toBe('bbox must have 4 numbers')
  })

  it('falls back to a generic problem when the body is not JSON', async () => {
    server.use(http.get('/api/boom', () => new HttpResponse('nope', { status: 500 })))
    const error = await request('/boom').catch((e) => e)
    expect((error).problem.detail).toBe('An unexpected error occurred')
  })

  it('clears an expired token and retries public routes anonymously', async () => {
    tokenStorage.set('expired-token')
    const cleared = vi.fn()
    window.addEventListener(TOKEN_CLEARED_EVENT, cleared)

    const authHeaders = []
    server.use(
      http.get('/api/lands-x', ({ request: req }) => {
        const auth = req.headers.get('Authorization')
        authHeaders.push(auth)
        if (auth) return problemJson(401, { detail: 'Token expired' })
        return HttpResponse.json({ ok: true })
      }),
    )

    await expect(request('/lands-x', { anonymousRetryOn401: true })).resolves.toEqual({
      ok: true,
    })
    expect(authHeaders).toEqual(['Bearer expired-token', null])
    expect(tokenStorage.get()).toBeNull()
    expect(cleared).toHaveBeenCalledOnce()
    window.removeEventListener(TOKEN_CLEARED_EVENT, cleared)
  })

  it('throws UnauthorizedError on protected routes and clears the token', async () => {
    tokenStorage.set('expired-token')
    server.use(http.post('/api/lands-x', () => problemJson(401, { detail: 'Unauthorized' })))

    const error = await request('/lands-x', { method: 'POST', body: {} }).catch(
      (e) => e,
    )
    expect(error).toBeInstanceOf(UnauthorizedError)
    expect(tokenStorage.get()).toBeNull()
  })

  it('throws UnauthorizedError when anonymous requests get 401', async () => {
    server.use(http.get('/api/anon', () => problemJson(401, { detail: 'Unauthorized' })))
    const error = await request('/anon', { anonymousRetryOn401: true }).catch(
      (e) => e,
    )
    expect(error).toBeInstanceOf(UnauthorizedError)
  })

  it('propagates network errors', async () => {
    server.use(http.get('/api/down', () => HttpResponse.error()))
    await expect(request('/down')).rejects.toThrow()
  })
})
