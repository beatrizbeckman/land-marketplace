import { screen } from '@testing-library/react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { App } from './App'

vi.mock('@/features/map/MapCanvas', () => ({
  MapCanvas: () => <div data-testid="map-canvas" />,
}))

vi.mock('@/features/map/useBbox', () => ({
  useBbox: () => [-1, -1, 1, 1],
}))

vi.mock('@/features/map/useMapOverlay', async () => {
  const { useState } = await import('react')
  return {
    useMapOverlay: () => {
      const [container] = useState(() =>
        document.body.appendChild(document.createElement('div')),
      )
      return { container, setPosition: vi.fn() }
    },
  }
})

describe('App', () => {
  it('serves the map screen at /', async () => {
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(await screen.findByText(/lands on the map/)).toBeInTheDocument()
  })

  it('serves the login page at /login', () => {
    window.history.pushState({}, '', '/login')
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument()
  })

  it('serves the register page at /register', () => {
    window.history.pushState({}, '', '/register')
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument()
  })

  it('redirects /lands/new to login for anonymous users', () => {
    window.history.pushState({}, '', '/lands/new')
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument()
  })

  it('sends unknown routes back to the map', async () => {
    window.history.pushState({}, '', '/nowhere')
    render(<App />)
    expect(await screen.findByText(/lands on the map/)).toBeInTheDocument()
  })
})
