import { useEffect } from 'react'

// A simple accessible dialog. Pressing Escape closes it.
export default function Modal({ label, onClose, children }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="w-full max-w-md rounded-2xl bg-slate-800 p-6 shadow-2xl ring-1 ring-white/10"
      >
        {children}
      </div>
    </div>
  )
}