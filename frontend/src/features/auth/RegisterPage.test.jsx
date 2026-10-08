import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { Route } from 'react-router'
import { describe, expect, it } from 'vitest'

import { tokenStorage } from '@/shared/lib/token'
import { problemJson, server } from '@/test/server'
import { renderWithProviders } from '@/test/utils'

import { RegisterPage } from './RegisterPage'

function renderRegister() {
  return renderWithProviders(<RegisterPage />, {
    route: '/register',
    path: '/register',
    extraRoutes: <Route path="/" element={<p>home screen</p>} />,
  })
}

async function fillAndSubmit(user) {
  await user.type(screen.getByLabelText('Name'), 'Ana')
  await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')
  await user.type(screen.getByLabelText('Password'), 'secret-123')
  await user.click(screen.getByRole('button', { name: 'Create account' }))
}

describe('RegisterPage', () => {
  it('registers (201 without body) and logs in automatically', async () => {
    const calls = []
    server.use(
      http.post('/api/auth/register', () => {
        calls.push('register')
        return new HttpResponse(null, { status: 201 })
      }),
      http.post('/api/auth/login', () => {
        calls.push('login')
        return HttpResponse.json({ token: 'auto-login-token' })
      }),
    )

    const user = userEvent.setup()
    renderRegister()
    await fillAndSubmit(user)

    expect(await screen.findByText('home screen')).toBeInTheDocument()
    expect(calls).toEqual(['register', 'login'])
    expect(tokenStorage.get()).toBe('auto-login-token')
  })

  it('shows the duplicate e-mail error on the email field (409)', async () => {
    server.use(
      http.post('/api/auth/register', () =>
        problemJson(409, { detail: 'E-mail already registered' }),
      ),
    )
    const user = userEvent.setup()
    renderRegister()
    await fillAndSubmit(user)

    expect(
      await screen.findByText('This e-mail is already registered. Log in instead'),
    ).toBeInTheDocument()
    expect(tokenStorage.get()).toBeNull()
  })

  it('maps backend field violations (400) to the fields', async () => {
    server.use(
      http.post('/api/auth/register', () =>
        problemJson(400, {
          detail: 'Validation failed',
          errors: [{ field: 'password', message: 'password must have at least 8 characters' }],
        }),
      ),
    )
    const user = userEvent.setup()
    renderRegister()
    // Pass the client-side check so the request is actually sent.
    await user.type(screen.getByLabelText('Name'), 'Ana')
    await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await user.type(screen.getByLabelText('Password'), 'password-ok-123')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(
      await screen.findByText('password must have at least 8 characters'),
    ).toBeInTheDocument()
  })

  it('validates locally before hitting the API', async () => {
    const user = userEvent.setup()
    renderRegister()
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByText('Name is required')).toBeInTheDocument()
  })
})
