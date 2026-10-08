import { QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import Feature from 'ol/Feature'
import Draw from 'ol/interaction/Draw'
import VectorSource from 'ol/source/Vector'
import { MemoryRouter, Route, Routes } from 'react-router'
import { toast } from 'sonner'
import { describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/features/auth/AuthContext'
import { MapContext } from '@/features/map/MapContext'
import { polygonFromGeoJson } from '@/shared/lib/geo'
import { makeLand, squarePolygon } from '@/test/fixtures'
import { problemJson, server } from '@/test/server'
import { createMapContextValue, createTestQueryClient } from '@/test/utils'

import { draftStore } from './draftStore'
import { NewLandSession } from './NewLandSession'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
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

function renderSession() {
  const value = createMapContextValue()
  const onConflictChange = vi.fn()
  const onPublished = vi.fn()
  const lands = [makeLand(1)] // square at (0,0)

  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/lands/new']}>
          <Routes>
            <Route
              path="/lands/new"
              element={
                <MapContext.Provider value={value}>
                  <NewLandSession
                    lands={lands}
                    landsSource={new VectorSource()}
                    onConflictChange={onConflictChange}
                    onPublished={onPublished}
                  />
                </MapContext.Provider>
              }
            />
            <Route path="/" element={<p>home screen</p>} />
            <Route path="/login" element={<p>login screen</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )

  const findDraw = () =>
    value.map
      .getInteractions()
      .getArray()
      .find((interaction) => interaction instanceof Draw)

  const closePolygon = (lon = 0.01, lat = 0.01) => {
    const polygon = polygonFromGeoJson(squarePolygon(lon, lat))
    act(() => {
      findDraw().dispatchEvent({ type: 'drawend', feature: new Feature(polygon) })
    })
  }

  return { value, onConflictChange, onPublished, findDraw, closePolygon }
}

async function fillForm(user) {
  await user.type(screen.getByLabelText('Total price'), '185000')
  await user.type(
    screen.getByLabelText('Description'),
    'Flat land close to the river, ready to build.',
  )
  await user.type(screen.getByLabelText('Contact'), 'owner@example.com')
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Publish land' })).toBeEnabled(),
  )
}

describe('NewLandSession', () => {
  it('starts on the outline step with the drawing hint', () => {
    renderSession()
    expect(screen.getByText('Draw the outline of your land')).toBeInTheDocument()
    expect(
      screen.getByText('Click the first point or double-click to finish'),
    ).toBeInTheDocument()
  })

  it('moves to details when the polygon closes and publishes successfully', async () => {
    const user = userEvent.setup()
    const { closePolygon, onPublished } = renderSession()

    closePolygon()
    expect(screen.getByText('Drag a point to adjust the outline')).toBeInTheDocument()

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Publish land' }))

    expect(await screen.findByText('home screen')).toBeInTheDocument()
    expect(onPublished).toHaveBeenCalledWith(99)
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith('Land published')
  })

  it('flags the overlap, names the conflicting land and blocks publishing', async () => {
    const { closePolygon, onConflictChange } = renderSession()

    // Overlaps the existing land at (0,0).
    closePolygon(0.0005, 0.0005)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This area overlaps an existing land',
    )
    expect(onConflictChange).toHaveBeenCalledWith(1)
    expect(screen.getAllByText('Overlaps Nº 001').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Publish land' })).toBeDisabled()
  })

  it('treats a backend 409 as an overlap, keeping the form filled', async () => {
    server.use(
      http.post('/api/lands', () =>
        problemJson(409, { detail: 'Land overlaps an existing land' }),
      ),
    )
    const user = userEvent.setup()
    const { closePolygon } = renderSession()
    closePolygon()
    await fillForm(user)

    await user.click(screen.getByRole('button', { name: 'Publish land' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This area overlaps an existing land',
    )
    expect(screen.getByLabelText('Contact')).toHaveValue('owner@example.com')
    expect(screen.getByRole('button', { name: 'Publish land' })).toBeDisabled()
  })

  it('maps backend 400 field violations, including geometry', async () => {
    server.use(
      http.post('/api/lands', () =>
        problemJson(400, {
          detail: 'Validation failed',
          errors: [
            { field: 'geometry', message: 'geometry must be a valid polygon' },
            { field: 'price', message: 'price must have at most 2 decimal places' },
          ],
        }),
      ),
    )
    const user = userEvent.setup()
    const { closePolygon } = renderSession()
    closePolygon()
    await fillForm(user)

    await user.click(screen.getByRole('button', { name: 'Publish land' }))

    expect(await screen.findByText('geometry must be a valid polygon')).toBeInTheDocument()
    expect(screen.getByText('price must have at most 2 decimal places')).toBeInTheDocument()
  })

  it('saves the draft and goes to login on 401', async () => {
    server.use(
      http.post('/api/lands', () => problemJson(401, { detail: 'Unauthorized' })),
    )
    const user = userEvent.setup()
    const { closePolygon } = renderSession()
    closePolygon()
    await fillForm(user)

    await user.click(screen.getByRole('button', { name: 'Publish land' }))

    expect(await screen.findByText('login screen')).toBeInTheDocument()
    expect(draftStore.load()).not.toBeNull()
    expect(draftStore.load().values.contact).toBe('owner@example.com')
  })

  it('restores a stored draft straight into the details step', () => {
    draftStore.save({
      geometry: squarePolygon(0.02, 0.02),
      values: {
        price: '185,000',
        description: 'Restored draft description.',
        contact: 'owner@example.com',
      },
    })
    renderSession()

    expect(screen.getByText('Drag a point to adjust the outline')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toHaveValue('Restored draft description.')
    expect(draftStore.load()).toBeNull() // consumed
  })

  it('redraw returns to the outline step but keeps the details', async () => {
    const user = userEvent.setup()
    const { closePolygon } = renderSession()
    closePolygon()
    await user.type(screen.getByLabelText('Description'), 'Keep me around, please.')

    await user.click(screen.getByRole('button', { name: 'Redraw' }))
    expect(screen.getByText('Draw the outline of your land')).toBeInTheDocument()

    closePolygon(0.03, 0.03)
    expect(screen.getByLabelText('Description')).toHaveValue('Keep me around, please.')
  })

  it('cancel leaves the flow back to the map', async () => {
    const user = userEvent.setup()
    renderSession()
    await user.click(screen.getByRole('button', { name: 'Cancel and go back' }))
    expect(await screen.findByText('home screen')).toBeInTheDocument()
  })
})
