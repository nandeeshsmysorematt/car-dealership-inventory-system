import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import VehicleForm from './VehicleForm'

const creta = { id: 1, make: 'Hyundai', model: 'Creta', category: 'SUV', price: 1500000, quantity: 5 }

async function fillForm(user, values = {}) {
  const data = { Make: 'Kia', Model: 'Seltos', Category: 'SUV', Price: '1600000', Quantity: '3', ...values }
  for (const [label, value] of Object.entries(data)) {
    const field = screen.getByLabelText(label)
    await user.clear(field)
    if (value !== '') await user.type(field, value)
  }
}

describe('VehicleForm', () => {
  it('shows an add title for a new vehicle and an edit title when editing', () => {
    const { rerender } = render(<VehicleForm onSubmit={() => {}} onCancel={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Add vehicle' })).toBeInTheDocument()
    rerender(<VehicleForm vehicle={creta} onSubmit={() => {}} onCancel={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Edit vehicle' })).toBeInTheDocument()
  })

  it('prefills the fields when editing', () => {
    render(<VehicleForm vehicle={creta} onSubmit={() => {}} onCancel={() => {}} />)
    expect(screen.getByLabelText('Make')).toHaveValue('Hyundai')
    expect(screen.getByLabelText('Model')).toHaveValue('Creta')
    expect(screen.getByLabelText('Category')).toHaveValue('SUV')
    expect(screen.getByLabelText('Price')).toHaveValue(1500000)
    expect(screen.getByLabelText('Quantity')).toHaveValue(5)
  })

  it('submits trimmed text and numeric price and quantity', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<VehicleForm onSubmit={onSubmit} onCancel={() => {}} />)
    await fillForm(user, { Make: '  Kia  ' })
    await user.click(screen.getByRole('button', { name: 'Save vehicle' }))
    expect(onSubmit).toHaveBeenCalledWith({
      make: 'Kia',
      model: 'Seltos',
      category: 'SUV',
      price: 1600000,
      quantity: 3,
    })
  })

  it('requires every field', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<VehicleForm onSubmit={onSubmit} onCancel={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Save vehicle' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('All fields are required')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rejects a price of zero or less', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<VehicleForm onSubmit={onSubmit} onCancel={() => {}} />)
    await fillForm(user, { Price: '0' })
    await user.click(screen.getByRole('button', { name: 'Save vehicle' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Price must be greater than zero')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rejects a negative or fractional quantity', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<VehicleForm onSubmit={onSubmit} onCancel={() => {}} />)
    await fillForm(user, { Quantity: '-1' })
    await user.click(screen.getByRole('button', { name: 'Save vehicle' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Quantity must be a whole number, zero or more',
    )
    await fillForm(user, { Quantity: '2.5' })
    await user.click(screen.getByRole('button', { name: 'Save vehicle' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Quantity must be a whole number, zero or more',
    )
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onCancel when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<VehicleForm onSubmit={() => {}} onCancel={onCancel} />)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows an error passed in from the parent', () => {
    render(<VehicleForm onSubmit={() => {}} onCancel={() => {}} error="Could not save the vehicle." />)
    expect(screen.getByRole('alert')).toHaveTextContent('Could not save the vehicle.')
  })

  it('disables Save while submitting', () => {
    render(<VehicleForm onSubmit={() => {}} onCancel={() => {}} submitting />)
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
  })
})
