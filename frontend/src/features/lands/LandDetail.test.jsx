import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { makeLand } from '@/test/fixtures'

import { LandDetail } from './LandDetail'

describe('LandDetail', () => {
  it('shows the full description, contact and backend-derived numbers', () => {
    render(
      <LandDetail
        land={makeLand(14, { price: 185_000, areaSqm: 12_483 })}
        onBack={vi.fn()}
      />,
    )
    expect(screen.getByText('Land Nº 014')).toBeInTheDocument()
    expect(screen.getByText('R$ 185,000')).toBeInTheDocument()
    expect(screen.getByText('1.25 ha')).toBeInTheDocument()
    expect(screen.getByText('R$ 14.82/m²')).toBeInTheDocument()
    expect(screen.getByText('owner@example.com')).toBeInTheDocument()
  })

  it('opens the contact target on "Contact seller"', async () => {
    const user = userEvent.setup()
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<LandDetail land={makeLand(1)} onBack={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Contact seller' }))
    expect(open).toHaveBeenCalledWith('mailto:owner@example.com', '_self')
    open.mockRestore()
  })

  it('goes back to the list', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<LandDetail land={makeLand(1)} onBack={onBack} />)
    await user.click(screen.getByRole('button', { name: 'Back to the list' }))
    expect(onBack).toHaveBeenCalled()
  })

  it('shows the ownership tag for own lands', () => {
    render(<LandDetail land={makeLand(1, { ownedByMe: true })} onBack={vi.fn()} />)
    expect(screen.getByText('Listed by you')).toBeInTheDocument()
  })
})
