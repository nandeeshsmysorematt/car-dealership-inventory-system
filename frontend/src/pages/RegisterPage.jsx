import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard'
import TextField from '../components/TextField'
import { useAuth } from '../auth/AuthContext'

function describeError(error) {
  const status = error?.response?.status
  if (status === 409) return 'This email is already registered'
  if (status === 422) return 'Please enter a valid email and password'
  if (error?.response) return 'Something went wrong. Please try again.'
  return 'Unable to reach the server. Please try again.'
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    if (!email.trim() || !password) return 'Email and password are required'
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (password !== confirm) return 'Passwords do not match'
    return ''
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await register(email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(describeError(err))
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Register to browse and purchase vehicles"
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="font-medium text-indigo-300 hover:text-indigo-200">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <TextField id="email" label="Email" type="email" autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <TextField id="password" label="Password" type="password" autoComplete="new-password"
          maxLength={64} value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters" />
        <TextField id="confirm" label="Confirm password" type="password" autoComplete="new-password"
          maxLength={64} value={confirm} onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat your password" />
        {error && (
          <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        <button type="submit" disabled={submitting}
          className="w-full rounded-lg bg-indigo-500 px-4 py-2 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthCard>
  )
}