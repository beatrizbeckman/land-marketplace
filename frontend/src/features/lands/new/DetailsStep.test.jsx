import { zodResolver } from '@hookform/resolvers/zod'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'

import { squarePolygon } from '@/test/fixtures'

import { DetailsStep } from './DetailsStep'
import { landFormSchema } from './landFormSchema'

function Harness({
  overlapping = false,
  geometryError = null,
  isPublishing = false,
  onPublish = vi.fn(),
  onCancel = vi.fn(),
}) {
  const form = useForm({
    resolver: zodResolver(landFormSchema),
    mode: 'onChange',
    defaultValues: { price: '', description: '', contact: '' },
  })
  return (
    <DetailsStep
      form={form}
      geometry={squarePolygon(0, 0)}
      previewAreaSqm={12_500}
      overlapping={overlapping}
      geometryError={geometryError}
      isPublishing={isPublishing}
      onCancel={onCancel}
      onPublish={onPublish}
    />
  )
}

async function fillValidForm(user) {
  await user.type(screen.getByLabelText('Total price'), '185000.5')
  await user.type(
    screen.getByLabelText('Description'),
    'Flat land close to the river, ready to build.',
  )
  await user.type(screen.getByLabelText('Contact'), 'owner@example.com')
}

describe('DetailsStep', () => {
  it('shows the area preview and live price per m²', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    expect(screen.getByText('1.25 ha')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Total price'), '185000')
    expect(screen.getByText('R$ 14.80/m²')).toBeInTheDocument()
  })

  it('masks the price input as BRL while typing', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByLabelText('Total price')
    await user.type(input, '185000.509')
    expect(input).toHaveValue('185,000.50')
  })

  it('keeps Publish disabled until the form is valid', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const publish = screen.getByRole('button', { name: 'Publish land' })
    expect(publish).toBeDisabled()

    await fillValidForm(user)
    await waitFor(() => expect(publish).toBeEnabled())
  })

  it('shows Zod errors under each field', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByLabelText('Description'), 'short')
    await user.tab()
    expect(
      await screen.findByText('Description must have at least 10 characters'),
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText('Contact'), 'not a contact')
    await user.tab()
    expect(
      await screen.findByText('Contact must be a valid e-mail or a phone with 10 to 15 digits'),
    ).toBeInTheDocument()
  })

  it('updates the description counter', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByLabelText('Description'), 'hello land')
    expect(screen.getByText('10 / 500')).toBeInTheDocument()
  })

  it('blocks publishing and explains while the draft overlaps', async () => {
    const user = userEvent.setup()
    render(<Harness overlapping />)
    await fillValidForm(user)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This area overlaps an existing land',
    )
    expect(screen.getByText('Fix the outline to publish. Your details are kept.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publish land' })).toBeDisabled()
  })

  it('shows a geometry error coming from the backend', () => {
    render(<Harness geometryError="geometry must be a valid polygon" />)
    expect(screen.getByText('geometry must be a valid polygon')).toBeInTheDocument()
  })

  it('submits through onPublish when valid', async () => {
    const user = userEvent.setup()
    const onPublish = vi.fn()
    render(<Harness onPublish={onPublish} />)
    await fillValidForm(user)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Publish land' })).toBeEnabled(),
    )
    await user.click(screen.getByRole('button', { name: 'Publish land' }))
    expect(onPublish).toHaveBeenCalled()
  })

  it('shows the publishing state', () => {
    render(<Harness isPublishing />)
    expect(screen.getByRole('button', { name: 'Publishing…' })).toBeDisabled()
  })
})
