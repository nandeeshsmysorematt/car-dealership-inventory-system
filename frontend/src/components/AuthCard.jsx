// The centred card shared by the login and register pages.
export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white/5 p-8 shadow-xl ring-1 ring-white/10 backdrop-blur">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
        <div className="mt-6">{children}</div>
        <div className="mt-6 text-center text-sm text-slate-300">{footer}</div>
      </div>
    </main>
  )
}