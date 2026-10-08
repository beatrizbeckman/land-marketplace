import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import Map from 'ol/Map'
import View from 'ol/View'
import { MemoryRouter, Route, Routes } from 'react-router'
import { vi } from 'vitest'

import { AuthProvider } from '@/features/auth/AuthContext'
import { MapContext } from '@/features/map/MapContext'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

/** Renders with QueryClient + Auth + MemoryRouter, like the real app shell. */
export function renderWithProviders(
  ui,
  { route = '/', path = '/', extraRoutes, queryClient } = {},
) {
  const client = queryClient ?? createTestQueryClient()
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path={path} element={ui} />
            {extraRoutes}
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

/** A real (detached, unrendered) ol/Map: interactions, layers and views work. */
export function createTestMap() {
  return new Map({ controls: [], layers: [], view: new View({ center: [0, 0], zoom: 10 }) })
}

export function createMapContextValue(map = createTestMap()) {
  return { map, baseLayer: 'satellite', setBaseLayer: vi.fn() }
}

export function withMapContext(ui, value = createMapContextValue()) {
  return <MapContext.Provider value={value}>{ui}</MapContext.Provider>
}
