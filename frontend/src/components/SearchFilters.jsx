import { useState } from 'react'

const EMPTY_FILTERS = { make: '', model: '', category: '', minPrice: '', maxPrice: '' }

const inputClass =
  'mt-1 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'

function Field({ id, label, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-300">
        {label}
      </label>
      <input id={id} className={inputClass} {...props} />
    </div>
  )
}

export default function SearchFilters({ onSearch }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [error, setError] = useState('')

  const update = (field) => (event) =>
    setFilters((current) => ({ ...current, [field]: event.target.value }))

  function handleSubmit(event) {
    event.preventDefault()
    const cleaned = {
      make: filters.make.trim(),
      model: filters.model.trim(),
      category: filters.category.trim(),
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
    }
    if (cleaned.minPrice && cleaned.maxPrice && Number(cleaned.minPrice) > Number(cleaned.maxPrice)) {
      setError('Minimum price cannot be higher than maximum price')
      return
    }
    setError('')
    onSearch(cleaned)
  }

  function handleClear() {
    setFilters(EMPTY_FILTERS)
    setError('')
    onSearch(EMPTY_FILTERS)
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mt-6 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field id="filter-make" label="Make" value={filters.make} onChange={update('make')} placeholder="e.g. Tata" />
        <Field id="filter-model" label="Model" value={filters.model} onChange={update('model')} placeholder="e.g. Nexon" />
        <Field id="filter-category" label="Category" value={filters.category} onChange={update('category')} placeholder="e.g. SUV" />
        <Field id="filter-min" label="Min price" type="number" min="0" value={filters.minPrice} onChange={update('minPrice')} placeholder="₹" />
        <Field id="filter-max" label="Max price" type="number" min="0" value={filters.maxPrice} onChange={update('maxPrice')} placeholder="₹" />
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      <div className="mt-4 flex gap-3">
        <button type="submit" className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
          Search
        </button>
        <button type="button" onClick={handleClear} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10">
          Clear
        </button>
      </div>
    </form>
  )
}