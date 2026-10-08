import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { makeLand } from '@/test/fixtures'

import { LandCard } from './LandCard'

const noop = () => {}

describe('LandCard', () => {
  it('shows price, lot number, area and price per m² from backend data', () => {
    render(
      <LandCard
        land={makeLand(14, { price: 185_000, areaSqm: 12_483 })}
        selected={false}
        hovered={false}
        onClick={noop}
        onHoverChange={noop}
      />,
    )
    expect(screen.getByText('R$ 185,000')).toBeInTheDocument()
    expect(screen.getByText('Nº 014')).toBeInTheDocument()
    expect(screen.getByText('1.25 ha · R$ 14.82/m²')).toBeInTheDocument()
  })

  it('replaces the lot number with "Listed by you" for own lands', () => {
    render(
      <LandCard
        land={makeLand(14, { ownedByMe: true })}
        selected={false}
        hovered={false}
        onClick={noop}
        onHoverChange={noop}
      />,
    )
    expect(screen.getByText('Listed by you')).toBeInTheDocument()
    expect(screen.queryByText('Nº 014')).not.toBeInTheDocument()
  })

  it('fires click and hover callbacks', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const onHoverChange = vi.fn()
    render(
      <LandCard
        land={makeLand(1)}
        selected={false}
        hovered={false}
        onClick={onClick}
        onHoverChange={onHoverChange}
      />,
    )
    await user.hover(screen.getByRole('button'))
    expect(onHoverChange).toHaveBeenCalledWith(true)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })

  it('marks the selected card', () => {
    render(
      <LandCard
        land={makeLand(1)}
        selected
        hovered={false}
        onClick={noop}
        onHoverChange={noop}
      />,
    )
    expect(screen.getByRole('button')).toHaveAttribute('aria-current', 'true')
  })
})
