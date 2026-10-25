// Indian digit grouping, e.g. 1500000 -> ₹15,00,000
const formatPrice = (price) => `₹${Number(price).toLocaleString('en-IN')}`

const adminButton =
  'rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10'

export default function VehicleCard({
  vehicle,
  onPurchase,
  busy = false,
  isAdmin = false,
  onEdit,
  onDelete,
  onRestock,
}) {
  const outOfStock = vehicle.quantity <= 0
  const lowStock = !outOfStock && vehicle.quantity <= 3
  const name = `${vehicle.make} ${vehicle.model}`

  return (
    <article className="flex flex-col rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 transition hover:-translate-y-1 hover:bg-white/10">
      <span className="w-fit rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-200">
        {vehicle.category}
      </span>
      <h3 className="mt-3 text-lg font-semibold text-white">{name}</h3>
      <p className="mt-1 text-2xl font-bold text-white">{formatPrice(vehicle.price)}</p>
      <p
        className={`mt-2 text-sm font-medium ${
          outOfStock ? 'text-red-300' : lowStock ? 'text-amber-300' : 'text-emerald-300'
        }`}
      >
        {outOfStock ? 'Out of stock' : `${vehicle.quantity} in stock`}
      </p>
      <button
        type="button"
        onClick={() => onPurchase(vehicle)}
        disabled={outOfStock || busy}
        className="mt-4 rounded-lg bg-indigo-500 px-4 py-2 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
      >
        {busy ? 'Purchasing…' : 'Purchase'}
      </button>
      {isAdmin && (
        <div className="mt-3 flex gap-2 border-t border-white/10 pt-3">
          <button type="button" aria-label={`Edit ${name}`} onClick={() => onEdit(vehicle)} className={adminButton}>
            Edit
          </button>
          <button type="button" aria-label={`Restock ${name}`} onClick={() => onRestock(vehicle)} className={adminButton}>
            Restock
          </button>
          <button
            type="button"
            aria-label={`Delete ${name}`}
            onClick={() => onDelete(vehicle)}
            className={`${adminButton} ml-auto border-red-400/40 text-red-300 hover:bg-red-500/10`}
          >
            Delete
          </button>
        </div>
      )}
    </article>
  )
}