import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchVehicles, searchVehicles } from '../api/vehicles'
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
  fetchVehicles.mockResolvedValue([creta, carens])
})

function renderDashboard() {
  saveToken(makeToken({ sub: '1', role: 'user', exp: nowInSeconds() + 3600 }))
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

describe('Dashboard search', () => {
  it('searches with the typed filters and shows only the matches', async () => {
    const user = userEvent.setup()
    searchVehicles.mockResolvedValue([creta])
    renderDashboard()
    await screen.findByText('Kia Carens')
    await user.type(screen.getByLabelText('Make'), 'hyundai')
    await user.click(screen.getByRole('button', { name: 'Search' }))
    expect(searchVehicles).toHaveBeenCalledWith({
      make: 'hyundai',
      model: '',
      category: '',
      minPrice: '',
      maxPrice: '',
    })
    expect(await screen.findByText('Hyundai Creta')).toBeInTheDocument()
    expect(screen.queryByText('Kia Carens')).not.toBeInTheDocument()
  })

  it('shows a message when nothing matches', async () => {
    const user = userEvent.setup()
    searchVehicles.mockResolvedValue([])
    renderDashboard()
    await screen.findByText('Hyundai Creta')
    await user.type(screen.getByLabelText('Make'), 'ferrari')
    await user.click(screen.getByRole('button', { name: 'Search' }))
    expect(await screen.findByText(/no vehicles match your search/i)).toBeInTheDocument()
  })

  it('Clear reloads the full list', async () => {
    const user = userEvent.setup()
    searchVehicles.mockResolvedValue([creta])
    renderDashboard()
    await screen.findByText('Kia Carens')
    await user.type(screen.getByLabelText('Make'), 'hyundai')
    await user.click(screen.getByRole('button', { name: 'Search' }))
    await screen.findByText('Hyundai Creta')
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(await screen.findByText('Kia Carens')).toBeInTheDocument()
    expect(fetchVehicles).toHaveBeenCalledTimes(2)
  })

  it('an empty search loads the full list instead of calling search', async () => {
    const user = userEvent.setup()
    renderDashboard()
    await screen.findByText('Kia Carens')
    await user.click(screen.getByRole('button', { name: 'Search' }))
    expect(searchVehicles).not.toHaveBeenCalled()
    expect(fetchVehicles).toHaveBeenCalledTimes(2)
  })

  it('shows an error when the search request fails', async () => {
    const user = userEvent.setup()
    searchVehicles.mockRejectedValue(new Error('boom'))
    renderDashboard()
    await screen.findByText('Kia Carens')
    await user.type(screen.getByLabelText('Make'), 'kia')
    await user.click(screen.getByRole('button', { name: 'Search' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not search vehicles/i)
  })
})