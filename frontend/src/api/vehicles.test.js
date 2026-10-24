import { beforeEach, describe, expect, it, vi } from 'vitest'
import client from './client'
import {
  createVehicle,
  deleteVehicle,
  fetchVehicles,
  purchaseVehicle,
  restockVehicle,
  searchVehicles,
  updateVehicle,
} from './vehicles'

vi.mock('./client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

beforeEach(() => vi.resetAllMocks())

describe('vehicle API', () => {
  it('fetchVehicles gets the full list', async () => {
    client.get.mockResolvedValue({ data: [{ id: 1 }] })
    expect(await fetchVehicles()).toEqual([{ id: 1 }])
    expect(client.get).toHaveBeenCalledWith('/api/vehicles')
  })

  it('searchVehicles sends only the filters that have a value', async () => {
    client.get.mockResolvedValue({ data: [] })
    await searchVehicles({ make: 'tata', model: '', category: 'SUV', minPrice: '500000', maxPrice: '' })
    expect(client.get).toHaveBeenCalledWith('/api/vehicles/search', {
      params: { make: 'tata', category: 'SUV', min_price: '500000' },
    })
  })

  it('purchaseVehicle posts to the purchase endpoint', async () => {
    client.post.mockResolvedValue({ data: { id: 4, quantity: 2 } })
    expect(await purchaseVehicle(4)).toEqual({ id: 4, quantity: 2 })
    expect(client.post).toHaveBeenCalledWith('/api/vehicles/4/purchase')
  })

  it('createVehicle posts the vehicle', async () => {
    client.post.mockResolvedValue({ data: { id: 9 } })
    const vehicle = { make: 'Kia', model: 'Seltos', category: 'SUV', price: 1, quantity: 1 }
    expect(await createVehicle(vehicle)).toEqual({ id: 9 })
    expect(client.post).toHaveBeenCalledWith('/api/vehicles', vehicle)
  })

  it('updateVehicle puts the vehicle', async () => {
    client.put.mockResolvedValue({ data: { id: 3 } })
    const vehicle = { make: 'Kia', model: 'Seltos', category: 'SUV', price: 1, quantity: 1 }
    await updateVehicle(3, vehicle)
    expect(client.put).toHaveBeenCalledWith('/api/vehicles/3', vehicle)
  })

  it('deleteVehicle calls the delete endpoint', async () => {
    client.delete.mockResolvedValue({})
    await deleteVehicle(5)
    expect(client.delete).toHaveBeenCalledWith('/api/vehicles/5')
  })

  it('restockVehicle posts the amount', async () => {
    client.post.mockResolvedValue({ data: { id: 6, quantity: 15 } })
    expect(await restockVehicle(6, 10)).toEqual({ id: 6, quantity: 15 })
    expect(client.post).toHaveBeenCalledWith('/api/vehicles/6/restock', { quantity: 10 })
  })
})