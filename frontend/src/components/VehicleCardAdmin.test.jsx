import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import VehicleCard from './VehicleCard'

const vehicle = { id: 1, make: 'Hyundai', model: 'Creta', category: 'SUV', price: 1500000, quantity: 5 }

describe('VehicleCard admin controls', () => {
  it('hides Edit, Delete and Restock by default', () => {
    render(<VehicleCard vehicle={vehicle} onPurchase={() => {}} />)
    expect(screen.queryByRole('button', { name: 'Edit Hyundai Creta' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete Hyundai Creta' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Restock Hyundai Creta' })).not.toBeInTheDocument()
  })

  it('shows Edit, Delete and Restock for admins', () => {
    render(<VehicleCard vehicle={vehicle} onPurchase={() => {}} isAdmin />)
    expect(screen.getByRole('button', { name: 'Edit Hyundai Creta' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete Hyundai Creta' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Restock Hyundai Creta' })).toBeInTheDocument()
  })

  it('calls the matching handler with the vehicle', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const onRestock = vi.fn()
    render(
      <VehicleCard vehicle={vehicle} onPurchase={() => {}} isAdmin
        onEdit={onEdit} onDelete={onDelete} onRestock={onRestock} />,
    )
    await user.click(screen.getByRole('button', { name: 'Edit Hyundai Creta' }))
    await user.click(screen.getByRole('button', { name: 'Delete Hyundai Creta' }))
    await user.click(screen.getByRole('button', { name: 'Restock Hyundai Creta' }))
    expect(onEdit).toHaveBeenCalledWith(vehicle)
    expect(onDelete).toHaveBeenCalledWith(vehicle)
    expect(onRestock).toHaveBeenCalledWith(vehicle)
  })

  it('still shows the Purchase button for admins', () => {
    render(<VehicleCard vehicle={vehicle} onPurchase={() => {}} isAdmin />)
    expect(screen.getByRole('button', { name: 'Purchase' })).toBeEnabled()
  })
})