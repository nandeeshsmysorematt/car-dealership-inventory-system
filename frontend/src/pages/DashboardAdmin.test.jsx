import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createVehicle,
  deleteVehicle,
  fetchVehicles,
  restockVehicle,
  updateVehicle,
} from '../api/vehicles'
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

function renderDashboard(role = 'admin') {
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

async function fillVehicleForm(user, dialog, values) {
  for (const [label, value] of Object.entries(values)) {
    const field = within(dialog).getByLabelText(label)
    await user.clear(field)
    await user.type(field, value)
  }
}

describe('Admin controls visibility', () => {
  it('shows Add vehicle and per-card controls to admins', async () => {
    renderDashboard('admin')
    await screen.findByText('Hyundai Creta')
    expect(screen.getByRole('button', { name: 'Add vehicle' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit Hyundai Creta' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete Kia Carens' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Restock Kia Carens' })).toBeInTheDocument()
  })

  it('hides every admin control from regular users', async () => {
    renderDashboard('user')
    await screen.findByText('Hyundai Creta')
    expect(screen.queryByRole('button', { name: 'Add vehicle' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit Hyundai Creta' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete Hyundai Creta' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Restock Hyundai Creta' })).not.toBeInTheDocument()
  })
})

describe('Add vehicle', () => {
  it('adds a vehicle and shows it in the list', async () => {
    const user = userEvent.setup()
    const seltos = { id: 3, make: 'Kia', model: 'Seltos', category: 'SUV', price: 1600000, quantity: 3 }
    createVehicle.mockResolvedValue(seltos)
    renderDashboard()
    await screen.findByText('Hyundai Creta')
    await user.click(screen.getByRole('button', { name: 'Add vehicle' }))
    const dialog = await screen.findByRole('dialog')
    await fillVehicleForm(user, dialog, {
      Make: 'Kia', Model: 'Seltos', Category: 'SUV', Price: '1600000', Quantity: '3',
    })
    await user.click(within(dialog).getByRole('button', { name: 'Save vehicle' }))
    expect(createVehicle).toHaveBeenCalledWith({
      make: 'Kia', model: 'Seltos', category: 'SUV', price: 1600000, quantity: 3,
    })
    expect(await screen.findByText('Kia Seltos')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await screen.findByRole('status')).toHaveTextContent('Added Kia Seltos')
  })

  it('keeps the form open and shows an error when saving fails', async () => {
    const user = userEvent.setup()
    createVehicle.mockRejectedValue({ response: { status: 422 } })
    renderDashboard()
    await screen.findByText('Hyundai Creta')
    await user.click(screen.getByRole('button', { name: 'Add vehicle' }))
    const dialog = await screen.findByRole('dialog')
    await fillVehicleForm(user, dialog, {
      Make: 'Kia', Model: 'Seltos', Category: 'SUV', Price: '1600000', Quantity: '3',
    })
    await user.click(within(dialog).getByRole('button', { name: 'Save vehicle' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/could not save the vehicle/i)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes the form without saving when Cancel is clicked', async () => {
    const user = userEvent.setup()
    renderDashboard()
    await screen.findByText('Hyundai Creta')
    await user.click(screen.getByRole('button', { name: 'Add vehicle' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(createVehicle).not.toHaveBeenCalled()
  })
})

describe('Edit vehicle', () => {
  it('opens prefilled and saves the changes to the card', async () => {
    const user = userEvent.setup()
    updateVehicle.mockResolvedValue({ ...creta, price: 1450000 })
    renderDashboard()
    await user.click(await screen.findByRole('button', { name: 'Edit Hyundai Creta' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText('Make')).toHaveValue('Hyundai')
    expect(within(dialog).getByLabelText('Price')).toHaveValue(1500000)
    await fillVehicleForm(user, dialog, { Price: '1450000' })
    await user.click(within(dialog).getByRole('button', { name: 'Save vehicle' }))
    expect(updateVehicle).toHaveBeenCalledWith(1, {
      make: 'Hyundai', model: 'Creta', category: 'SUV', price: 1450000, quantity: 2,
    })
    expect(await screen.findByText('₹14,50,000')).toBeInTheDocument()
    expect(await screen.findByRole('status')).toHaveTextContent('Updated Hyundai Creta')
  })
})

describe('Delete vehicle', () => {
  it('asks for confirmation, then removes the vehicle', async () => {
    const user = userEvent.setup()
    deleteVehicle.mockResolvedValue()
    renderDashboard()
    await user.click(await screen.findByRole('button', { name: 'Delete Hyundai Creta' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/delete hyundai creta\?/i)).toBeInTheDocument()
    expect(deleteVehicle).not.toHaveBeenCalled()
    await user.click(within(dialog).getByRole('button', { name: 'Delete vehicle' }))
    expect(deleteVehicle).toHaveBeenCalledWith(1)
    await waitFor(() => expect(screen.queryByText('Hyundai Creta')).not.toBeInTheDocument())
    expect(screen.getByText('Kia Carens')).toBeInTheDocument()
  })

  it('does nothing when the confirmation is cancelled', async () => {
    const user = userEvent.setup()
    renderDashboard()
    await user.click(await screen.findByRole('button', { name: 'Delete Hyundai Creta' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(deleteVehicle).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Hyundai Creta')).toBeInTheDocument()
  })

  it('shows an error and keeps the vehicle when deleting fails', async () => {
    const user = userEvent.setup()
    deleteVehicle.mockRejectedValue({ response: { status: 403 } })
    renderDashboard()
    await user.click(await screen.findByRole('button', { name: 'Delete Hyundai Creta' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete vehicle' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not delete hyundai creta/i)
    expect(screen.getByText('Hyundai Creta')).toBeInTheDocument()
  })
})

describe('Restock vehicle', () => {
  it('adds stock and updates the card', async () => {
    const user = userEvent.setup()
    restockVehicle.mockResolvedValue({ ...creta, quantity: 12 })
    renderDashboard()
    await user.click(await screen.findByRole('button', { name: 'Restock Hyundai Creta' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Quantity to add'), '10')
    await user.click(within(dialog).getByRole('button', { name: 'Add stock' }))
    expect(restockVehicle).toHaveBeenCalledWith(1, 10)
    expect(await screen.findByText('12 in stock')).toBeInTheDocument()
    expect(await screen.findByRole('status')).toHaveTextContent('Restocked Hyundai Creta')
  })

  it('rejects zero or non-whole amounts without calling the API', async () => {
    const user = userEvent.setup()
    renderDashboard()
    await user.click(await screen.findByRole('button', { name: 'Restock Hyundai Creta' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Quantity to add'), '0')
    await user.click(within(dialog).getByRole('button', { name: 'Add stock' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Enter a whole number greater than zero',
    )
    expect(restockVehicle).not.toHaveBeenCalled()
  })

  it('keeps the dialog open and shows an error when restocking fails', async () => {
    const user = userEvent.setup()
    restockVehicle.mockRejectedValue({ response: { status: 403 } })
    renderDashboard()
    await user.click(await screen.findByRole('button', { name: 'Restock Hyundai Creta' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Quantity to add'), '5')
    await user.click(within(dialog).getByRole('button', { name: 'Add stock' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/could not restock/i)
  })
})