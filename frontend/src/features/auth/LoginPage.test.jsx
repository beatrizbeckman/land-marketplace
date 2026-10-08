import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { Route } from 'react-router'
import { describe, expect, it } from 'vitest'

import { tokenStorage } from '@/shared/lib/token'
import { problemJson, server } from '@/test/server'
import { renderWithProviders } from '@/test/utils'

import { LoginPage } from './LoginPage'

function renderLogin(route = '/login') {
  return renderWithProviders(<LoginPage />, {
    route,
    path: '/login',
    extraRoutes: (
      <>
        <Route path="/" element={<p>home screen</p>} />
        <Route path="/lands/new" element={<p>new land screen</p>} />
      </>
    ),
  })
}

describe('LoginPage', () => {
  it('validates required fields before calling the API', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByText('E-mail is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
  })

  it('stores the token and navigates home on success', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret-123')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByText('home screen')).toBeInTheDocument()
    expect(tokenStorage.get()).toBe('test-token')
  })

  it('shows a generic message on invalid credentials (401)', async () => {
    server.use(
      http.post('/api/auth/login', () => problemJson(401, { detail: 'Bad credentials' })),
    )
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrong-pass')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByText('Invalid e-mail or password')).toBeInTheDocument()
    expect(tokenStorage.get()).toBeNull()
  })

  it('returns to the protected origin after logging in', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />, {
      route: '/login',
      path: '/login',
      extraRoutes: <Route path="/lands/new" element={<p>new land screen</p>} />,
    })
    // Simulate arriving from the protected route.
    window.history.replaceState({}, '')
    await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret-123')
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    await waitFor(() => expect(tokenStorage.get()).toBe('test-token'))
  })
})
