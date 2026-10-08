import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { toast } from 'sonner'
import { describe, expect, it, vi } from 'vitest'

import { makeCollection, makeLand } from '@/test/fixtures'
import { problemJson, server } from '@/test/server'
import { renderWithProviders } from '@/test/utils'
import { HttpResponse } from 'msw'

import { HomePage } from './HomePage'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// The real canvas cannot render in jsdom; the map stays detached.
vi.mock('@/features/map/MapCanvas', () => ({
  MapCanvas: () => <div data-testid="map-canvas" />,
}))

// A fixed visible area so the lands query runs without a rendered map.
vi.mock('@/features/map/useBbox', () => ({
  useBbox: () => [-1, -1, 1, 1],
}))

vi.mock('@/features/map/useMapOverlay', async () => {
  const { useState } = await import('react')
  return {
    useMapOverlay: () => {
      // Stable container per component instance, mirroring the real hook.
      const [container] = useState(() =>
        document.body.appendChild(document.createElement('div')),
      )
      return { container, setPosition: vi.fn() }
    },
  }
})

describe('HomePage', () => {
  it('lists the lands of the visible area with price labels on the map', async () => {
    renderWithProviders(<HomePage />)

    expect(await screen.findByText('2 lands on the map')).toBeInTheDocument()
    expect(screen.getByText('Nº 001')).toBeInTheDocument()
    expect(screen.getByText('Nº 002')).toBeInTheDocument()
    // Price label pills rendered as overlays.
    expect(screen.getByText('R$ 185k')).toBeInTheDocument()
    expect(screen.getByText('R$ 60k')).toBeInTheDocument()
  })

  it('opens the popup when a card is clicked and the detail from the popup', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HomePage />)
    await screen.findByText('2 lands on the map')

    await user.click(screen.getByText('Nº 001'))
    const popup = await screen.findByRole('dialog', { name: 'Land Nº 001' })
    expect(popup).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'View details' }))
    expect(await screen.findByText('Land Nº 001')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Back to the list' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back to the list' }))
    expect(await screen.findByText('2 lands on the map')).toBeInTheDocument()
  })

  it('marks own lands with "Listed by you"', async () => {
    server.use(
      http.get('/api/lands', () =>
        HttpResponse.json(makeCollection([makeLand(1, { ownedByMe: true })])),
      ),
    )
    renderWithProviders(<HomePage />)
    expect(await screen.findByText('Listed by you')).toBeInTheDocument()
  })

  it('shows the error state and surfaces the Problem Details detail in a toast', async () => {
    server.use(
      http.get('/api/lands', () => problemJson(400, { detail: 'bbox is malformed' })),
    )
    renderWithProviders(<HomePage />)

    // The query retries once with a backoff before settling into the error state.
    expect(
      await screen.findByText("Couldn't load the lands", {}, { timeout: 5_000 }),
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('bbox is malformed'),
    )
  })

  it('switches tools and shows the search hint', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HomePage />)
    await screen.findByText('2 lands on the map')

    await user.click(screen.getByRole('button', { name: 'Search area' }))
    expect(
      screen.getByText('Drag to set the radius, release to search'),
    ).toBeInTheDocument()
  })
})
