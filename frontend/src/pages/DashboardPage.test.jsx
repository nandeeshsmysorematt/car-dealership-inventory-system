import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchVehicles, purchaseVehicle } from '../api/vehicles'
import { AuthProvider } from '../auth/AuthContext'
import { saveToken } from '../auth/tokenStorage'
import { makeToken, nowInSeconds } from '../test/makeToken'
import DashboardPage from './DashboardPage'

vi.mock('../api/vehicles', () => ({
  fetchVehicles: vi.fn(),
  searchVehicles: vi.fn(),
  purchaseVehicle: vi.fn(),
  createVehicle: vi.fn(),
  updateVehicle: vi.fn(),
  deleteVehicle: vi.fn(),
  restockVehicle: vi.fn(),
}))

const creta = { id: 1, make: 'Hyundai', model: 'Creta', category: 'SUV', price: 1500000, quantity: 2 }
const carens = { id: 2, make: 'Kia', model: 'Carens', category: 'MPV', price: 1200000, quantity: 0 }

beforeEach(() => {
  localStorage.clear()
  vi.resetAllMocks()
})

function renderDashboard(role = 'user') {
  saveToken(makeToken({ sub: '1', role, exp: nowInSeconds() + 3600 }))
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/login" element={<div>Login screen</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('DashboardPage', () => {
  it('shows a loading state, then the vehicles', async () => {
    fetchVehicles.mockResolvedValue([creta, carens])
    renderDashboard()
    expect(screen.getByText(/loading vehicles/i)).toBeInTheDocument()
    expect(await screen.findByText('Hyundai Creta')).toBeInTheDocument()
    expect(screen.getByText('Kia Carens')).toBeInTheDocument()
  })

  it('shows an empty message when there are no vehicles', async () => {
    fetchVehicles.mockResolvedValue([])
    renderDashboard()
    expect(await screen.findByText(/no vehicles found/i)).toBeInTheDocument()
  })

  it('shows an error with a retry button when loading fails', async () => {
    const user = userEvent.setup()
    fetchVehicles.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce([creta])
    renderDashboard()
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load vehicles/i)
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('Hyundai Creta')).toBeInTheDocument()
  })

  it('disables Purchase for out-of-stock vehicles only', async () => {
    fetchVehicles.mockResolvedValue([creta, carens])
    renderDashboard()
    await screen.findByText('Hyundai Creta')
    const buttons = screen.getAllByRole('button', { name: /purchase/i })
    expect(buttons[0]).toBeEnabled()
    expect(buttons[1]).toBeDisabled()
  })

  it('purchasing updates the stock shown on the card', async () => {
    const user = userEvent.setup()
    fetchVehicles.mockResolvedValue([creta])
    purchaseVehicle.mockResolvedValue({ ...creta, quantity: 1 })
    renderDashboard()
    await screen.findByText('2 in stock')
    await user.click(screen.getByRole('button', { name: /purchase/i }))
    expect(purchaseVehicle).toHaveBeenCalledWith(1)
    expect(await screen.findByText('1 in stock')).toBeInTheDocument()
    expect(await screen.findByRole('status')).toHaveTextContent(/purchased hyundai creta/i)
  })

  it('shows an error when a purchase fails because stock ran out', async () => {
    const user = userEvent.setup()
    fetchVehicles.mockResolvedValue([creta])
    purchaseVehicle.mockRejectedValue({ response: { status: 409 } })
    renderDashboard()
    await user.click(await screen.findByRole('button', { name: /purchase/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/out of stock/i)
  })

  it('shows the signed-in role and lets the user log out', async () => {
    const user = userEvent.setup()
    fetchVehicles.mockResolvedValue([creta])
    renderDashboard('admin')
    await screen.findByText('Hyundai Creta')
    expect(within(screen.getByRole('banner')).getByText(/admin/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /log out/i }))
    expect(await screen.findByText('Login screen')).toBeInTheDocument()
  })
})