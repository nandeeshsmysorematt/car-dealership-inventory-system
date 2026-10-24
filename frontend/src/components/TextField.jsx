// A labelled input, so every form field is accessible and styled the same way.
export default function TextField({ id, label, ...inputProps }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-200">
        {label}
      </label>
      <input
        id={id}
        {...inputProps}
        className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
      />
    </div>
  )
}