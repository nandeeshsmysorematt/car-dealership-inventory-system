import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import VehicleCard from './VehicleCard'

const vehicle = { id: 1, make: 'Hyundai', model: 'Creta', category: 'SUV', price: 1500000, quantity: 5 }

describe('VehicleCard', () => {
  it('shows make, model, category, price in rupees and stock', () => {
    render(<VehicleCard vehicle={vehicle} onPurchase={() => {}} />)
    expect(screen.getByText('Hyundai Creta')).toBeInTheDocument()
    expect(screen.getByText('SUV')).toBeInTheDocument()
    expect(screen.getByText('₹15,00,000')).toBeInTheDocument()
    expect(screen.getByText('5 in stock')).toBeInTheDocument()
  })

  it('enables Purchase when the vehicle is in stock', () => {
    render(<VehicleCard vehicle={vehicle} onPurchase={() => {}} />)
    expect(screen.getByRole('button', { name: /purchase/i })).toBeEnabled()
  })

  it('disables Purchase and shows Out of stock when quantity is zero', () => {
    render(<VehicleCard vehicle={{ ...vehicle, quantity: 0 }} onPurchase={() => {}} />)
    expect(screen.getByRole('button', { name: /purchase/i })).toBeDisabled()
    expect(screen.getByText('Out of stock')).toBeInTheDocument()
  })

  it('calls onPurchase with the vehicle when Purchase is clicked', async () => {
    const user = userEvent.setup()
    const onPurchase = vi.fn()
    render(<VehicleCard vehicle={vehicle} onPurchase={onPurchase} />)
    await user.click(screen.getByRole('button', { name: /purchase/i }))
    expect(onPurchase).toHaveBeenCalledWith(vehicle)
  })

  it('disables Purchase while a purchase is in progress', () => {
    render(<VehicleCard vehicle={vehicle} onPurchase={() => {}} busy />)
    expect(screen.getByRole('button', { name: /purchasing/i })).toBeDisabled()
  })
})