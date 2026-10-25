import { useState } from 'react'
import Modal from './Modal'

export default function RestockDialog({ vehicle, onSubmit, onCancel, submitting = false, error = '' }) {
  const [amount, setAmount] = useState('')
  const [validationError, setValidationError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const quantity = Number(amount)
    if (amount === '' || !Number.isInteger(quantity) || quantity <= 0) {
      setValidationError('Enter a whole number greater than zero')
      return
    }
    setValidationError('')
    onSubmit(quantity)
  }

  const shownError = validationError || error

  return (
    <Modal label="Restock vehicle" onClose={onCancel}>
      <form onSubmit={handleSubmit} noValidate>
        <h2 className="text-xl font-bold text-white">{`Restock ${vehicle.make} ${vehicle.model}`}</h2>
        <label htmlFor="restock-amount" className="mt-4 block text-sm font-medium text-slate-200">
          Quantity to add
        </label>
        <input
          id="restock-amount"
          type="number"
          min="1"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        />
        {shownError && (
          <p role="alert" className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {shownError}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? 'Adding…' : 'Add stock'}
          </button>
        </div>
      </form>
    </Modal>
  )
}