import { screen } from '@testing-library/react'
import { Route } from 'react-router'
import { describe, expect, it } from 'vitest'

import { tokenStorage } from '@/shared/lib/token'
import { renderWithProviders } from '@/test/utils'

import { ProtectedRoute } from './ProtectedRoute'

describe('ProtectedRoute', () => {
  it('redirects anonymous users to /login', () => {
    renderWithProviders(
      <ProtectedRoute>
        <p>protected content</p>
      </ProtectedRoute>,
      {
        route: '/lands/new',
        path: '/lands/new',
        extraRoutes: <Route path="/login" element={<p>login screen</p>} />,
      },
    )
    expect(screen.getByText('login screen')).toBeInTheDocument()
    expect(screen.queryByText('protected content')).not.toBeInTheDocument()
  })

  it('renders the children when authenticated', () => {
    tokenStorage.set('valid-token')
    renderWithProviders(
      <ProtectedRoute>
        <p>protected content</p>
      </ProtectedRoute>,
      { route: '/lands/new', path: '/lands/new' },
    )
    expect(screen.getByText('protected content')).toBeInTheDocument()
  })
})
