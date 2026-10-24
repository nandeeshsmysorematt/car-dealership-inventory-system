import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard'
import TextField from '../components/TextField'
import { useAuth } from '../auth/AuthContext'

function describeError(error) {
  if (error?.response?.status === 401) return 'Invalid email or password'
  if (error?.response) return 'Something went wrong. Please try again.'
  return 'Unable to reach the server. Please try again.'
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError('Email and password are required')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(describeError(err))
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to manage the dealership inventory"
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-medium text-indigo-300 hover:text-indigo-200">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <TextField id="email" label="Email" type="email" autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <TextField id="password" label="Password" type="password" autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
        {error && (
          <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        <button type="submit" disabled={submitting}
          className="w-full rounded-lg bg-indigo-500 px-4 py-2 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthCard>
  )
}