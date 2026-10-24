import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { makeToken, nowInSeconds } from '../test/makeToken'
import { AuthProvider } from './AuthContext'
import ProtectedRoute from './ProtectedRoute'
import { saveToken } from './tokenStorage'

beforeEach(() => localStorage.clear())

function renderSecret({ role, requireAdmin = false } = {}) {
  if (role) saveToken(makeToken({ sub: '1', role, exp: nowInSeconds() + 3600 }))
  render(
    <MemoryRouter initialEntries={['/secret']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Login screen</div>} />
          <Route path="/" element={<div>Home screen</div>} />
          <Route
            path="/secret"
            element={
              <ProtectedRoute requireAdmin={requireAdmin}>
                <div>Secret content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('sends logged-out visitors to the login page', () => {
    renderSecret()
    expect(screen.getByText('Login screen')).toBeInTheDocument()
  })

  it('shows the content to a logged-in user', () => {
    renderSecret({ role: 'user' })
    expect(screen.getByText('Secret content')).toBeInTheDocument()
  })

  it('keeps regular users out of admin-only pages', () => {
    renderSecret({ role: 'user', requireAdmin: true })
    expect(screen.getByText('Home screen')).toBeInTheDocument()
  })

  it('lets admins into admin-only pages', () => {
    renderSecret({ role: 'admin', requireAdmin: true })
    expect(screen.getByText('Secret content')).toBeInTheDocument()
  })
})