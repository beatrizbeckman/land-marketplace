import { Navigate, useLocation } from 'react-router'

import { useAuth } from './AuthContext'

/** Redirects anonymous visitors to /login, remembering where they came from. */
export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}
