import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from 'react-router'
import { describe, expect, it } from 'vitest'

import { tokenStorage, userStorage } from '@/shared/lib/token'
import { renderWithProviders } from '@/test/utils'

import { TopRightNav } from './TopRightNav'

describe('TopRightNav', () => {
  it('offers Log in and List your land to anonymous visitors', () => {
    renderWithProviders(<TopRightNav />)
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /List your land/ })).toBeInTheDocument()
  })

  it('navigates to the login page', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TopRightNav />, {
      extraRoutes: <Route path="/login" element={<p>login screen</p>} />,
    })
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByText('login screen')).toBeInTheDocument()
  })

  it('sends "List your land" to the protected route', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TopRightNav />, {
      extraRoutes: <Route path="/lands/new" element={<p>new land screen</p>} />,
    })
    await user.click(screen.getByRole('button', { name: /List your land/ }))
    expect(await screen.findByText('new land screen')).toBeInTheDocument()
  })

  it('shows the signed-in pill with initials and logs out on click', async () => {
    tokenStorage.set('token')
    userStorage.set('Marina Silva')
    const user = userEvent.setup()
    renderWithProviders(<TopRightNav />)

    expect(screen.getByText('MS')).toBeInTheDocument()
    expect(screen.getByText('Marina Silva')).toBeInTheDocument()

    await user.click(screen.getByTitle('Log out'))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument(),
    )
    expect(tokenStorage.get()).toBeNull()
  })
})
