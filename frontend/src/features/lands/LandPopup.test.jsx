import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { makeLand } from '@/test/fixtures'

import { LandPopup } from './LandPopup'

const setPosition = vi.fn()

// The overlay container lives inside the (detached) map viewport in production;
// attaching it to the body here lets Testing Library reach the portal content.
vi.mock('@/features/map/useMapOverlay', () => ({
  useMapOverlay: () => {
    const container = document.body.appendChild(document.createElement('div'))
    return { container, setPosition }
  },
}))

describe('LandPopup', () => {
  it('renders nothing without a selected land', () => {
    render(<LandPopup land={null} onClose={vi.fn()} onViewDetails={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(setPosition).toHaveBeenCalledWith(undefined)
  })

  it('shows price, lot, area, price per m² and the truncated description', () => {
    render(
      <LandPopup
        land={makeLand(14, { price: 185_000, areaSqm: 12_483 })}
        onClose={vi.fn()}
        onViewDetails={vi.fn()}
      />,
    )
    expect(screen.getByRole('dialog', { name: 'Land Nº 014' })).toBeInTheDocument()
    expect(screen.getByText('R$ 185,000')).toBeInTheDocument()
    expect(screen.getByText('1.25 ha')).toBeInTheDocument()
    expect(screen.getByText('R$ 14.82/m²')).toBeInTheDocument()
  })

  it('anchors the overlay to the land', () => {
    setPosition.mockClear()
    render(<LandPopup land={makeLand(1)} onClose={vi.fn()} onViewDetails={vi.fn()} />)
    expect(setPosition).toHaveBeenCalledWith(expect.any(Array))
  })

  it('closes on X and on Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<LandPopup land={makeLand(1)} onClose={onClose} onViewDetails={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Close popup' }))
    expect(onClose).toHaveBeenCalledTimes(1)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('opens the full detail via "View details"', async () => {
    const user = userEvent.setup()
    const onViewDetails = vi.fn()
    render(<LandPopup land={makeLand(1)} onClose={vi.fn()} onViewDetails={onViewDetails} />)
    await user.click(screen.getByRole('button', { name: 'View details' }))
    expect(onViewDetails).toHaveBeenCalled()
  })

  it('links "Contact seller" to a phone contact with tel:', async () => {
    const user = userEvent.setup()
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(
      <LandPopup
        land={makeLand(1, { contact: '+55 (61) 99999-0000' })}
        onClose={vi.fn()}
        onViewDetails={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Contact seller' }))
    expect(open).toHaveBeenCalledWith('tel:+5561999990000', '_self')
    open.mockRestore()
  })
})
