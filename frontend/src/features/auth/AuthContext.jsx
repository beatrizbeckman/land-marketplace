import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { TOKEN_CLEARED_EVENT, tokenStorage, userStorage } from '@/shared/lib/token'

import { loginUser, registerUser } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState(() => tokenStorage.get())
  const [displayName, setDisplayName] = useState(() => userStorage.get())

  // ownedByMe depends on who is asking, so land queries must be refetched
  // whenever the identity changes (login, logout or token expiry).
  const invalidateLands = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['lands'] })
  }, [queryClient])

  useEffect(() => {
    const onCleared = () => {
      setToken(null)
      setDisplayName(null)
      invalidateLands()
    }
    window.addEventListener(TOKEN_CLEARED_EVENT, onCleared)
    return () => window.removeEventListener(TOKEN_CLEARED_EVENT, onCleared)
  }, [invalidateLands])

  const login = useCallback(
    async (input) => {
      const { token: newToken } = await loginUser(input)
      const name = input.email.split('@')[0] ?? input.email
      tokenStorage.set(newToken)
      userStorage.set(name)
      setToken(newToken)
      setDisplayName(name)
      invalidateLands()
    },
    [invalidateLands],
  )

  const register = useCallback(
    async (input) => {
      await registerUser(input)
      await login({ email: input.email, password: input.password })
      userStorage.set(input.name)
      setDisplayName(input.name)
    },
    [login],
  )

  const logout = useCallback(() => {
    tokenStorage.clear()
  }, [])

  const value = useMemo(
    () => ({ isAuthenticated: token !== null, displayName, login, register, logout }),
    [token, displayName, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
