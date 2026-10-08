import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { OutlineStep } from './OutlineStep'

describe('OutlineStep', () => {
  it('shows the live vertex count and area', () => {
    render(
      <OutlineStep vertices={3} areaSqm={12_500} onCancel={vi.fn()} onUndoLastPoint={vi.fn()} />,
    )
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('1.25 ha')).toBeInTheDocument()
  })

  it('shows a placeholder before any area exists', () => {
    render(<OutlineStep vertices={0} areaSqm={0} onCancel={vi.fn()} onUndoLastPoint={vi.fn()} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('lists the drawing shortcuts', () => {
    render(<OutlineStep vertices={0} areaSqm={0} onCancel={vi.fn()} onUndoLastPoint={vi.fn()} />)
    expect(screen.getByText('Ctrl + Z')).toBeInTheDocument()
    expect(screen.getByText('Esc')).toBeInTheDocument()
  })

  it('wires the footer buttons', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    const onUndoLastPoint = vi.fn()
    render(
      <OutlineStep vertices={1} areaSqm={0} onCancel={onCancel} onUndoLastPoint={onUndoLastPoint} />,
    )
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Undo last point' }))
    expect(onUndoLastPoint).toHaveBeenCalled()
  })
})
