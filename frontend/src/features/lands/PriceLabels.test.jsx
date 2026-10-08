import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { makeLand } from '@/test/fixtures'

import { PriceLabels } from './PriceLabels'

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

describe('PriceLabels', () => {
  it('renders one short-price pill per land', () => {
    render(
      <PriceLabels
        lands={[makeLand(1, { price: 185_000 }), makeLand(2, { price: 1_200_000, lon: 0.01 })]}
        selectedId={null}
        hidden={false}
        onSelect={vi.fn()}
      />,
    )
    expect(screen.getByText('R$ 185k')).toBeInTheDocument()
    expect(screen.getByText('R$ 1.2M')).toBeInTheDocument()
  })

  it('renders nothing while drawing (hidden)', () => {
    render(
      <PriceLabels lands={[makeLand(1)]} selectedId={null} hidden onSelect={vi.fn()} />,
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('selects the land when its label is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <PriceLabels lands={[makeLand(7)]} selectedId={null} hidden={false} onSelect={onSelect} />,
    )
    await user.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith(7)
  })
})
