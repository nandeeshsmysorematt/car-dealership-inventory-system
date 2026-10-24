import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loginRequest } from '../api/auth'
import { AuthProvider } from '../auth/AuthContext'
import { makeToken, nowInSeconds } from '../test/makeToken'
import LoginPage from './LoginPage'

vi.mock('../api/auth', () => ({ loginRequest: vi.fn(), registerRequest: vi.fn() }))

beforeEach(() => {
  localStorage.clear()
  vi.resetAllMocks()
})

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<div>Register screen</div>} />
          <Route path="/" element={<div>Dashboard screen</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

async function fillAndSubmit(user, email = 'user@example.com', password = 'User@12345') {
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: /sign in/i }))
}

describe('LoginPage', () => {
  it('shows email and password fields and a sign in button', () => {
    renderLogin()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('requires both fields before calling the API', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Email and password are required')
    expect(loginRequest).not.toHaveBeenCalled()
  })

  it('logs in and goes to the dashboard', async () => {
    const user = userEvent.setup()
    loginRequest.mockResolvedValue(makeToken({ sub: '1', role: 'user', exp: nowInSeconds() + 3600 }))
    renderLogin()
    await fillAndSubmit(user)
    expect(await screen.findByText('Dashboard screen')).toBeInTheDocument()
    expect(loginRequest).toHaveBeenCalledWith('user@example.com', 'User@12345')
  })

  it('shows an error for wrong credentials', async () => {
    const user = userEvent.setup()
    loginRequest.mockRejectedValue({ response: { status: 401 } })
    renderLogin()
    await fillAndSubmit(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password')
  })

  it('shows an error when the server cannot be reached', async () => {
    const user = userEvent.setup()
    loginRequest.mockRejectedValue(new Error('Network Error'))
    renderLogin()
    await fillAndSubmit(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to reach the server')
  })

  it('disables the button while signing in', async () => {
    const user = userEvent.setup()
    loginRequest.mockReturnValue(new Promise(() => {}))
    renderLogin()
    await fillAndSubmit(user)
    expect(await screen.findByRole('button', { name: /signing in/i })).toBeDisabled()
  })

  it('links to the register page', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('link', { name: /create an account/i }))
    expect(await screen.findByText('Register screen')).toBeInTheDocument()
  })
})