import { useCallback, useEffect, useState } from 'react'
import { fetchVehicles, purchaseVehicle } from '../api/vehicles'
import Navbar from '../components/Navbar'
import VehicleCard from '../components/VehicleCard'

function describePurchaseError(error, vehicle) {
  const name = `${vehicle.make} ${vehicle.model}`
  const status = error?.response?.status
  if (status === 409) return `Sorry, ${name} is out of stock.`
  if (status === 404) return `${name} is no longer available.`
  return 'Could not complete the purchase. Please try again.'
}

export default function DashboardPage() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [purchasingId, setPurchasingId] = useState(null)
  const [notice, setNotice] = useState('')
  const [actionError, setActionError] = useState('')

  const loadVehicles = useCallback(async () => {
    setLoading(true)
    setLoadFailed(false)
    try {
      setVehicles(await fetchVehicles())
    } catch {
      setLoadFailed(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadVehicles()
  }, [loadVehicles])

  async function handlePurchase(vehicle) {
    setNotice('')
    setActionError('')
    setPurchasingId(vehicle.id)
    try {
      const updated = await purchaseVehicle(vehicle.id)
      setVehicles((current) => current.map((v) => (v.id === updated.id ? updated : v)))
      setNotice(`Purchased ${vehicle.make} ${vehicle.model}.`)
    } catch (error) {
      setActionError(describePurchaseError(error, vehicle))
      // Stock may have changed under us, so quietly refresh the list.
      fetchVehicles().then(setVehicles).catch(() => {})
    } finally {
      setPurchasingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold text-white">Available vehicles</h1>
        <p className="mt-1 text-slate-300">Browse the current inventory and purchase a vehicle.</p>

        {notice && (
          <p role="status" className="mt-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            {notice}
          </p>
        )}
        {actionError && (
          <p role="alert" className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {actionError}
          </p>
        )}

        {loading && <p className="mt-10 text-slate-300">Loading vehicles…</p>}

        {!loading && loadFailed && (
          <div className="mt-10">
            <p role="alert" className="text-red-300">Could not load vehicles.</p>
            <button
              type="button"
              onClick={loadVehicles}
              className="mt-3 rounded-lg bg-indigo-500 px-4 py-2 font-semibold text-white hover:bg-indigo-400"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !loadFailed && vehicles.length === 0 && (
          <p className="mt-10 text-slate-300">No vehicles found.</p>
        )}

        {!loading && !loadFailed && vehicles.length > 0 && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onPurchase={handlePurchase}
                busy={purchasingId === vehicle.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}