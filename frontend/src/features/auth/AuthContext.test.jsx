import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { tokenStorage } from '@/shared/lib/token'
import { createTestQueryClient } from '@/test/utils'

import { AuthProvider, useAuth } from './AuthContext'

function setup() {
  const queryClient = createTestQueryClient()
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
  return { ...renderHook(() => useAuth(), { wrapper }), invalidateSpy }
}

describe('AuthContext', () => {
  it('starts anonymous and authenticates on login', async () => {
    const { result, invalidateSpy } = setup()
    expect(result.current.isAuthenticated).toBe(false)

    await act(() => result.current.login({ email: 'ana@example.com', password: 'secret-123' }))

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.displayName).toBe('ana')
    expect(tokenStorage.get()).toBe('test-token')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lands'] })
  })

  it('registers, auto-logs-in and keeps the registration name', async () => {
    const { result } = setup()
    await act(() =>
      result.current.register({ name: 'Ana Souza', email: 'ana@example.com', password: 'secret-123' }),
    )
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.displayName).toBe('Ana Souza')
  })

  it('logs out by clearing the token and invalidating land queries', async () => {
    const { result, invalidateSpy } = setup()
    await act(() => result.current.login({ email: 'ana@example.com', password: 'secret-123' }))
    invalidateSpy.mockClear()

    act(() => result.current.logout())

    await waitFor(() => expect(result.current.isAuthenticated).toBe(false))
    expect(tokenStorage.get()).toBeNull()
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lands'] })
  })

  it('reacts to tokens cleared elsewhere (expired token on a public route)', async () => {
    tokenStorage.set('stale-token')
    const { result } = setup()
    expect(result.current.isAuthenticated).toBe(true)

    act(() => tokenStorage.clear())

    await waitFor(() => expect(result.current.isAuthenticated).toBe(false))
  })

  it('throws when used outside the provider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used inside AuthProvider',
    )
  })
})
