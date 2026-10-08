import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Toolbar } from './Toolbar'

describe('Toolbar', () => {
  it('marks the active tool', () => {
    render(<Toolbar tool="select" onToolChange={vi.fn()} showSearchHint={false} />)
    expect(screen.getByRole('button', { name: 'Select' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Search area' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('switches tools', async () => {
    const user = userEvent.setup()
    const onToolChange = vi.fn()
    render(<Toolbar tool="select" onToolChange={onToolChange} showSearchHint={false} />)
    await user.click(screen.getByRole('button', { name: 'Search area' }))
    expect(onToolChange).toHaveBeenCalledWith('search')
  })

  it('switches back to the select tool', async () => {
    const user = userEvent.setup()
    const onToolChange = vi.fn()
    render(<Toolbar tool="search" onToolChange={onToolChange} showSearchHint={false} />)
    await user.click(screen.getByRole('button', { name: 'Select' }))
    expect(onToolChange).toHaveBeenCalledWith('select')
  })

  it('shows the drag hint while the search tool waits for a circle', () => {
    render(<Toolbar tool="search" onToolChange={vi.fn()} showSearchHint />)
    expect(
      screen.getByText('Drag to set the radius, release to search'),
    ).toBeInTheDocument()
  })
})
