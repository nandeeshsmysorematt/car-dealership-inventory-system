import { useState } from 'react'

const inputClass =
  'mt-1 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'

function Field({ id, label, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-200">
        {label}
      </label>
      <input id={id} className={inputClass} {...props} />
    </div>
  )
}

// Returns an error message, or '' when the values are valid.
function validate({ make, model, category, price, quantity }) {
  if (!make.trim() || !model.trim() || !category.trim() || price === '' || quantity === '') {
    return 'All fields are required'
  }
  if (!(Number(price) > 0)) return 'Price must be greater than zero'
  if (!Number.isInteger(Number(quantity)) || Number(quantity) < 0) {
    return 'Quantity must be a whole number, zero or more'
  }
  return ''
}

export default function VehicleForm({ vehicle, onSubmit, onCancel, submitting = false, error = '' }) {
  const [values, setValues] = useState({
    make: vehicle?.make ?? '',
    model: vehicle?.model ?? '',
    category: vehicle?.category ?? '',
    price: vehicle?.price ?? '',
    quantity: vehicle?.quantity ?? '',
  })
  const [validationError, setValidationError] = useState('')

  const update = (field) => (event) =>
    setValues((current) => ({ ...current, [field]: event.target.value }))

  function handleSubmit(event) {
    event.preventDefault()
    const problem = validate(values)
    if (problem) {
      setValidationError(problem)
      return
    }
    setValidationError('')
    onSubmit({
      make: values.make.trim(),
      model: values.model.trim(),
      category: values.category.trim(),
      price: Number(values.price),
      quantity: Number(values.quantity),
    })
  }

  const shownError = validationError || error

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2 className="text-xl font-bold text-white">{vehicle ? 'Edit vehicle' : 'Add vehicle'}</h2>
      <div className="mt-4 space-y-3">
        <Field id="vehicle-make" label="Make" value={values.make} onChange={update('make')} />
        <Field id="vehicle-model" label="Model" value={values.model} onChange={update('model')} />
        <Field id="vehicle-category" label="Category" value={values.category} onChange={update('category')} />
        <Field id="vehicle-price" label="Price" type="number" min="0" value={values.price} onChange={update('price')} />
        <Field id="vehicle-quantity" label="Quantity" type="number" min="0" value={values.quantity} onChange={update('quantity')} />
      </div>
      {shownError && (
        <p role="alert" className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {shownError}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? 'Saving…' : 'Save vehicle'}
        </button>
      </div>
    </form>
  )
}