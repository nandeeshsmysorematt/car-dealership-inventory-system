import Modal from './Modal'

export default function ConfirmDeleteDialog({ vehicle, onConfirm, onCancel, busy = false }) {
  const name = `${vehicle.make} ${vehicle.model}`
  return (
    <Modal label="Confirm delete" onClose={onCancel}>
      <h2 className="text-xl font-bold text-white">{`Delete ${name}?`}</h2>
      <p className="mt-2 text-sm text-slate-300">This removes the vehicle from the inventory. It cannot be undone.</p>
      <div className="mt-5 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10">
          Cancel
        </button>
        <button type="button" onClick={onConfirm} disabled={busy} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60">
          {busy ? 'Deleting…' : 'Delete vehicle'}
        </button>
      </div>
    </Modal>
  )
}