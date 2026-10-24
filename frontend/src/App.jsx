import { Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function TemporaryHome() {
  const { user, logout } = useAuth()
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 text-white">
      <h1 className="text-3xl font-bold">You are signed in as {user.role}</h1>
      <button onClick={logout} className="rounded-lg bg-indigo-500 px-4 py-2 font-semibold hover:bg-indigo-400">
        Log out
      </button>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<ProtectedRoute><TemporaryHome /></ProtectedRoute>} />
    </Routes>
  )
}