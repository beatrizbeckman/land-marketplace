import { describe, expect, it, vi } from 'vitest'

import { TOKEN_CLEARED_EVENT, tokenStorage, userStorage } from './token'

describe('tokenStorage', () => {
  it('stores and reads the token', () => {
    tokenStorage.set('abc')
    expect(tokenStorage.get()).toBe('abc')
  })

  it('clears token and user together, notifying listeners', () => {
    const listener = vi.fn()
    window.addEventListener(TOKEN_CLEARED_EVENT, listener)
    tokenStorage.set('abc')
    userStorage.set('ana')

    tokenStorage.clear()

    expect(tokenStorage.get()).toBeNull()
    expect(userStorage.get()).toBeNull()
    expect(listener).toHaveBeenCalledOnce()
    window.removeEventListener(TOKEN_CLEARED_EVENT, listener)
  })

  it('does not fire the event when there was no token', () => {
    const listener = vi.fn()
    window.addEventListener(TOKEN_CLEARED_EVENT, listener)
    tokenStorage.clear()
    expect(listener).not.toHaveBeenCalled()
    window.removeEventListener(TOKEN_CLEARED_EVENT, listener)
  })
})
