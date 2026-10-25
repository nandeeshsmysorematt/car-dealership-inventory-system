import client from './client'

export async function fetchVehicles() {
  const { data } = await client.get('/api/vehicles')
  return data
}

// Only filters that have a value are sent, so empty boxes never reach the API.
export async function searchVehicles({ make, model, category, minPrice, maxPrice } = {}) {
  const params = {}
  if (make) params.make = make
  if (model) params.model = model
  if (category) params.category = category
  if (minPrice) params.min_price = minPrice
  if (maxPrice) params.max_price = maxPrice
  const { data } = await client.get('/api/vehicles/search', { params })
  return data
}

export async function purchaseVehicle(id) {
  const { data } = await client.post(`/api/vehicles/${id}/purchase`)
  return data
}

export async function createVehicle(vehicle) {
  const { data } = await client.post('/api/vehicles', vehicle)
  return data
}

export async function updateVehicle(id, vehicle) {
  const { data } = await client.put(`/api/vehicles/${id}`, vehicle)
  return data
}

export async function deleteVehicle(id) {
  await client.delete(`/api/vehicles/${id}`)
}

export async function restockVehicle(id, quantity) {
  const { data } = await client.post(`/api/vehicles/${id}/restock`, { quantity })
  return data
}