import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { createMapContextValue, withMapContext } from '@/test/utils'

import { MapControls } from './MapControls'

describe('MapControls', () => {
  it('zooms in and out through the view animation', async () => {
    const user = userEvent.setup()
    const value = createMapContextValue()
    const animate = vi.spyOn(value.map.getView(), 'animate').mockImplementation(() => {})
    render(withMapContext(<MapControls />, value))

    await user.click(screen.getByRole('button', { name: 'Zoom in' }))
    expect(animate).toHaveBeenCalledWith(expect.objectContaining({ zoom: 11 }))

    await user.click(screen.getByRole('button', { name: 'Zoom out' }))
    expect(animate).toHaveBeenCalledWith(expect.objectContaining({ zoom: 9 }))
  })

  it('offers the three base layers and switches on click', async () => {
    const user = userEvent.setup()
    const value = createMapContextValue()
    render(withMapContext(<MapControls />, value))

    expect(screen.getByText('Satellite')).toBeInTheDocument()
    expect(screen.getByText('Terrain')).toBeInTheDocument()
    expect(screen.getByText('Streets')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Terrain/ }))
    expect(value.setBaseLayer).toHaveBeenCalledWith('terrain')
  })

  it('shows the attribution of the active layer', () => {
    render(withMapContext(<MapControls />))
    expect(screen.getByText(/Tiles © Esri/)).toBeInTheDocument()
  })

  it('marks the active layer as pressed', () => {
    render(withMapContext(<MapControls />))
    expect(screen.getByRole('button', { name: /Satellite/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: /Streets/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })
})
