import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { makeLand } from '@/test/fixtures'

import { LandsPanel } from './LandsPanel'

const baseProps = {
  lands: [makeLand(1), makeLand(2, { lon: 0.01 })],
  isLoading: false,
  isError: false,
  onRetry: vi.fn(),
  filters: {},
  onFiltersChange: vi.fn(),
  searchRadius: null,
  onClearSearch: vi.fn(),
  selectedId: null,
  hoveredId: null,
  onSelect: vi.fn(),
  onHover: vi.fn(),
  detailLand: null,
  onCloseDetail: vi.fn(),
}

describe('LandsPanel', () => {
  it('shows the map title without an active search', () => {
    render(<LandsPanel {...baseProps} />)
    expect(screen.getByText('2 lands on the map')).toBeInTheDocument()
    expect(screen.queryByText(/Within/)).not.toBeInTheDocument()
  })

  it('shows the search chip and the area title with an active search', () => {
    render(<LandsPanel {...baseProps} searchRadius={2_400} />)
    expect(screen.getByText('2 lands in this area')).toBeInTheDocument()
    expect(screen.getByText('Within 2.4 km')).toBeInTheDocument()
  })

  it('clears the search from the chip X', async () => {
    const user = userEvent.setup()
    const onClearSearch = vi.fn()
    render(<LandsPanel {...baseProps} searchRadius={300} onClearSearch={onClearSearch} />)
    await user.click(screen.getByRole('button', { name: 'Clear search area' }))
    expect(onClearSearch).toHaveBeenCalled()
  })

  it('applies a price range through the filter chip', async () => {
    const user = userEvent.setup()
    const onFiltersChange = vi.fn()
    render(<LandsPanel {...baseProps} onFiltersChange={onFiltersChange} />)
    await user.click(screen.getByRole('button', { name: /Price/ }))
    await user.click(await screen.findByRole('button', { name: /Show \d+ lands/ }))
    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ minPrice: 0, maxPrice: 185_000 }),
    )
  })

  it('shows the applied ranges on the filter chips', () => {
    render(
      <LandsPanel
        {...baseProps}
        filters={{ minPrice: 60_000, maxPrice: 250_000, minArea: 8_000, maxArea: 12_500 }}
      />,
    )
    expect(screen.getByRole('button', { name: /R\$ 60k – 250k/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /8,000 m² – 1.25 ha/ })).toBeInTheDocument()
  })

  it('switches to detail mode when a detail land is set', () => {
    render(<LandsPanel {...baseProps} detailLand={makeLand(14)} />)
    expect(screen.getByText('Land Nº 014')).toBeInTheDocument()
    expect(screen.queryByText('2 lands on the map')).not.toBeInTheDocument()
  })
})
