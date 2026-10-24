import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loginRequest, registerRequest } from '../api/auth'
import { AuthProvider } from '../auth/AuthContext'
import { makeToken, nowInSeconds } from '../test/makeToken'
import RegisterPage from './RegisterPage'

vi.mock('../api/auth', () => ({ loginRequest: vi.fn(), registerRequest: vi.fn() }))

beforeEach(() => {
  localStorage.clear()
  vi.resetAllMocks()
})

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<div>Login screen</div>} />
          <Route path="/" element={<div>Dashboard screen</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

async function fillAndSubmit(user, { email = 'new@example.com', password = 'StrongPass1', confirm = 'StrongPass1' } = {}) {
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.type(screen.getByLabelText('Confirm password'), confirm)
  await user.click(screen.getByRole('button', { name: /create account/i }))
}

describe('RegisterPage', () => {
  it('shows email, password and confirm password fields', () => {
    renderRegister()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument()
  })

  it('rejects mismatched passwords without calling the API', async () => {
    const user = userEvent.setup()
    renderRegister()
    await fillAndSubmit(user, { confirm: 'Different123' })
    expect(await screen.findByRole('alert')).toHaveTextContent('Passwords do not match')
    expect(registerRequest).not.toHaveBeenCalled()
  })

  it('rejects passwords shorter than 8 characters', async () => {
    const user = userEvent.setup()
    renderRegister()
    await fillAndSubmit(user, { password: 'short', confirm: 'short' })
    expect(await screen.findByRole('alert')).toHaveTextContent('Password must be at least 8 characters')
    expect(registerRequest).not.toHaveBeenCalled()
  })

  it('creates the account, logs in and goes to the dashboard', async () => {
    const user = userEvent.setup()
    registerRequest.mockResolvedValue({ id: 1, email: 'new@example.com', role: 'user' })
    loginRequest.mockResolvedValue(makeToken({ sub: '1', role: 'user', exp: nowInSeconds() + 3600 }))
    renderRegister()
    await fillAndSubmit(user)
    expect(await screen.findByText('Dashboard screen')).toBeInTheDocument()
    expect(registerRequest).toHaveBeenCalledWith('new@example.com', 'StrongPass1')
  })

  it('shows a clear message when the email is already registered', async () => {
    const user = userEvent.setup()
    registerRequest.mockRejectedValue({ response: { status: 409 } })
    renderRegister()
    await fillAndSubmit(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('This email is already registered')
  })

  it('shows an error when the server cannot be reached', async () => {
    const user = userEvent.setup()
    registerRequest.mockRejectedValue(new Error('Network Error'))
    renderRegister()
    await fillAndSubmit(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to reach the server')
  })

  it('links to the login page', async () => {
    const user = userEvent.setup()
    renderRegister()
    await user.click(screen.getByRole('link', { name: /sign in/i }))
    expect(await screen.findByText('Login screen')).toBeInTheDocument()
  })
})