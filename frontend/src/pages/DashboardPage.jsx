import { useCallback, useEffect, useState } from 'react'
import {
  createVehicle,
  deleteVehicle,
  fetchVehicles,
  purchaseVehicle,
  restockVehicle,
  searchVehicles,
  updateVehicle,
} from '../api/vehicles'
import { useAuth } from '../auth/AuthContext'
import ConfirmDeleteDialog from '../components/ConfirmDeleteDialog'
import Modal from '../components/Modal'
import Navbar from '../components/Navbar'
import RestockDialog from '../components/RestockDialog'
import SearchFilters from '../components/SearchFilters'
import VehicleCard from '../components/VehicleCard'
import VehicleForm from '../components/VehicleForm'

const nameOf = (vehicle) => `${vehicle.make} ${vehicle.model}`
const hasAnyFilter = (filters) => Object.values(filters).some((value) => value !== '')

function describePurchaseError(error, vehicle) {
  const status = error?.response?.status
  if (status === 409) return `Sorry, ${nameOf(vehicle)} is out of stock.`
  if (status === 404) return `${nameOf(vehicle)} is no longer available.`
  return 'Could not complete the purchase. Please try again.'
}

export default function DashboardPage() {
  const { isAdmin } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [activeFilters, setActiveFilters] = useState(null)
  const [purchasingId, setPurchasingId] = useState(null)
  const [notice, setNotice] = useState('')
  const [actionError, setActionError] = useState('')

  // Admin dialogs: which one is open and for which vehicle.
  const [dialog, setDialog] = useState(null) // { type: 'form' | 'delete' | 'restock', vehicle? }
  const [dialogBusy, setDialogBusy] = useState(false)
  const [dialogError, setDialogError] = useState('')

  const loadVehicles = useCallback(async (filters = null) => {
    setLoading(true)
    setLoadFailed(false)
    const searching = filters !== null && hasAnyFilter(filters)
    try {
      setVehicles(searching ? await searchVehicles(filters) : await fetchVehicles())
      setActiveFilters(searching ? filters : null)
    } catch {
      setLoadError(searching ? 'Could not search vehicles.' : 'Could not load vehicles.')
      setLoadFailed(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadVehicles()
  }, [loadVehicles])

  const replaceVehicle = (updated) =>
    setVehicles((current) => current.map((v) => (v.id === updated.id ? updated : v)))

  function openDialog(next) {
    setNotice('')
    setActionError('')
    setDialogError('')
    setDialog(next)
  }

  const closeDialog = useCallback(() => {
    setDialog(null)
    setDialogError('')
  }, [])

  async function handlePurchase(vehicle) {
    setNotice('')
    setActionError('')
    setPurchasingId(vehicle.id)
    try {
      replaceVehicle(await purchaseVehicle(vehicle.id))
      setNotice(`Purchased ${nameOf(vehicle)}.`)
    } catch (error) {
      setActionError(describePurchaseError(error, vehicle))
      // Stock may have changed under us, so quietly refresh the current view.
      const refresh = activeFilters ? searchVehicles(activeFilters) : fetchVehicles()
      refresh.then(setVehicles).catch(() => {})
    } finally {
      setPurchasingId(null)
    }
  }

  // Runs an admin action, then closes the dialog on success or shows an error.
  async function runDialogAction(action, onSuccess, failureMessage) {
    setDialogBusy(true)
    setDialogError('')
    try {
      const result = await action()
      onSuccess(result)
      closeDialog()
    } catch {
      setDialogError(failureMessage)
    } finally {
      setDialogBusy(false)
    }
  }

  function handleSaveVehicle(values) {
    const editing = dialog.vehicle
    return runDialogAction(
      () => (editing ? updateVehicle(editing.id, values) : createVehicle(values)),
      (saved) => {
        if (editing) {
          replaceVehicle(saved)
          setNotice(`Updated ${nameOf(saved)}.`)
        } else {
          setVehicles((current) => [...current, saved])
          setNotice(`Added ${nameOf(saved)}.`)
        }
      },
      'Could not save the vehicle. Please check the details and try again.',
    )
  }

  async function handleConfirmDelete() {
    const target = dialog.vehicle
    setDialogBusy(true)
    try {
      await deleteVehicle(target.id)
      setVehicles((current) => current.filter((v) => v.id !== target.id))
      setNotice(`Deleted ${nameOf(target)}.`)
    } catch {
      setActionError(`Could not delete ${nameOf(target)}.`)
    } finally {
      setDialogBusy(false)
      closeDialog()
    }
  }

  function handleRestock(quantity) {
    const target = dialog.vehicle
    return runDialogAction(
      () => restockVehicle(target.id, quantity),
      (updated) => {
        replaceVehicle(updated)
        setNotice(`Restocked ${nameOf(target)}.`)
      },
      'Could not restock the vehicle. Please try again.',
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white">Available vehicles</h1>
            <p className="mt-1 text-slate-300">Browse the current inventory and purchase a vehicle.</p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => openDialog({ type: 'form', vehicle: null })}
              className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-400"
            >
              Add vehicle
            </button>
          )}
        </div>

        <SearchFilters onSearch={loadVehicles} />

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
            <p role="alert" className="text-red-300">{loadError}</p>
            <button
              type="button"
              onClick={() => loadVehicles(activeFilters)}
              className="mt-3 rounded-lg bg-indigo-500 px-4 py-2 font-semibold text-white hover:bg-indigo-400"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !loadFailed && vehicles.length === 0 && (
          <p className="mt-10 text-slate-300">
            {activeFilters ? 'No vehicles match your search.' : 'No vehicles found.'}
          </p>
        )}

        {!loading && !loadFailed && vehicles.length > 0 && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onPurchase={handlePurchase}
                busy={purchasingId === vehicle.id}
                isAdmin={isAdmin}
                onEdit={(v) => openDialog({ type: 'form', vehicle: v })}
                onDelete={(v) => openDialog({ type: 'delete', vehicle: v })}
                onRestock={(v) => openDialog({ type: 'restock', vehicle: v })}
              />
            ))}
          </div>
        )}
      </main>

      {isAdmin && dialog?.type === 'form' && (
        <Modal label={dialog.vehicle ? 'Edit vehicle' : 'Add vehicle'} onClose={closeDialog}>
          <VehicleForm
            vehicle={dialog.vehicle}
            onSubmit={handleSaveVehicle}
            onCancel={closeDialog}
            submitting={dialogBusy}
            error={dialogError}
          />
        </Modal>
      )}
      {isAdmin && dialog?.type === 'delete' && (
        <ConfirmDeleteDialog
          vehicle={dialog.vehicle}
          onConfirm={handleConfirmDelete}
          onCancel={closeDialog}
          busy={dialogBusy}
        />
      )}
      {isAdmin && dialog?.type === 'restock' && (
        <RestockDialog
          vehicle={dialog.vehicle}
          onSubmit={handleRestock}
          onCancel={closeDialog}
          submitting={dialogBusy}
          error={dialogError}
        />
      )}
    </div>
  )
}