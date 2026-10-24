import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

// Keeps logged-out visitors on the login page and non-admins out of admin pages.
// The backend still enforces these rules; this only shapes the UI.
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />
  return children
}