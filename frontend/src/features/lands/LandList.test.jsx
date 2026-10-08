import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { makeLand } from '@/test/fixtures'

import { LandList } from './LandList'

const baseProps = {
  lands: [makeLand(1), makeLand(2, { lon: 0.01 })],
  isLoading: false,
  isError: false,
  selectedId: null,
  hoveredId: null,
  hasActiveFilters: false,
  hasActiveSearch: false,
  onRetry: vi.fn(),
  onSelect: vi.fn(),
  onHover: vi.fn(),
  onClearFilters: vi.fn(),
  onClearSearch: vi.fn(),
}

describe('LandList', () => {
  it('renders a skeleton while loading (never a spinner)', () => {
    render(<LandList {...baseProps} isLoading lands={[]} />)
    expect(screen.getByTestId('lands-skeleton')).toBeInTheDocument()
  })

  it('renders the error state with a retry button', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<LandList {...baseProps} isError lands={[]} onRetry={onRetry} />)
    expect(screen.getByText("Couldn't load the lands")).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('renders the empty state with contextual clear buttons', () => {
    render(<LandList {...baseProps} lands={[]} hasActiveFilters hasActiveSearch />)
    expect(screen.getByText('No lands in this area')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear search area' })).toBeInTheDocument()
  })

  it('hides clear buttons that do not apply', () => {
    render(<LandList {...baseProps} lands={[]} />)
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear search area' })).not.toBeInTheDocument()
  })

  it('renders one card per land and forwards selection', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<LandList {...baseProps} onSelect={onSelect} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    await user.click(screen.getByText('Nº 002'))
    expect(onSelect).toHaveBeenCalledWith(2)
  })
})
