import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { RangeFilterChip } from './RangeFilterChip'

const baseProps = {
  chipLabel: 'Price',
  title: 'Total price',
  bounds: { min: 0, max: 250_000 },
  applied: null,
  appliedLabel: null,
  totalCount: 7,
  inputPrefix: 'R$',
  countMatching: vi.fn(() => 5),
  onApply: vi.fn(),
}

describe('RangeFilterChip', () => {
  it('opens the popover with the preview count', async () => {
    const user = userEvent.setup()
    render(<RangeFilterChip {...baseProps} />)
    await user.click(screen.getByRole('button', { name: /Price/ }))
    expect(await screen.findByText('Total price')).toBeInTheDocument()
    expect(screen.getByText('5 of 7 lands match')).toBeInTheDocument()
  })

  it('applies the edited range only on "Show N lands"', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(<RangeFilterChip {...baseProps} onApply={onApply} />)
    await user.click(screen.getByRole('button', { name: /Price/ }))

    // The slider thumbs also carry "Minimum"/"Maximum" labels; target the textbox.
    const minInput = screen.getByRole('textbox', { name: /Minimum/ })
    await user.clear(minInput)
    await user.type(minInput, '60000')
    expect(onApply).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /Show 5 lands/ }))
    expect(onApply).toHaveBeenCalledWith({ min: 60_000, max: 250_000 })
  })

  it('clears the filter and closes', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(
      <RangeFilterChip
        {...baseProps}
        applied={{ min: 1, max: 2 }}
        appliedLabel="R$ 60k – 250k"
        onApply={onApply}
      />,
    )
    await user.click(screen.getByRole('button', { name: /R\$ 60k – 250k/ }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onApply).toHaveBeenCalledWith(null)
  })

  it('shows the applied range on the chip', () => {
    render(
      <RangeFilterChip {...baseProps} applied={{ min: 1, max: 2 }} appliedLabel="R$ 60k – 250k" />,
    )
    expect(screen.getByRole('button', { name: /R\$ 60k – 250k/ })).toBeInTheDocument()
  })
})
