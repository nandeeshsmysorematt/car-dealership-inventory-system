import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loginRequest, registerRequest } from '../api/auth'
import { makeToken, nowInSeconds } from '../test/makeToken'
import { AuthProvider, useAuth } from './AuthContext'
import { getToken, saveToken } from './tokenStorage'

vi.mock('../api/auth', () => ({ loginRequest: vi.fn(), registerRequest: vi.fn() }))

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
const validToken = (role = 'user') =>
  makeToken({ sub: '3', role, exp: nowInSeconds() + 3600 })

beforeEach(() => {
  localStorage.clear()
  vi.resetAllMocks()
})

describe('AuthProvider', () => {
  it('starts logged out when no token is stored', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isAdmin).toBe(false)
  })

  it('restores the session from a stored valid token', () => {
    saveToken(validToken('admin'))
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user).toMatchObject({ userId: 3, role: 'admin' })
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isAdmin).toBe(true)
  })

  it('discards an expired token', () => {
    saveToken(makeToken({ sub: '3', role: 'user', exp: nowInSeconds() - 10 }))
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user).toBeNull()
    expect(getToken()).toBeNull()
  })

  it('login stores the token and exposes the user', async () => {
    const token = validToken('user')
    loginRequest.mockResolvedValue(token)
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {
      await result.current.login('a@b.com', 'pw')
    })
    expect(loginRequest).toHaveBeenCalledWith('a@b.com', 'pw')
    expect(getToken()).toBe(token)
    expect(result.current.user).toMatchObject({ role: 'user' })
    expect(result.current.isAdmin).toBe(false)
  })

  it('a failed login leaves the user logged out', async () => {
    loginRequest.mockRejectedValue(new Error('bad credentials'))
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {
      await expect(result.current.login('a@b.com', 'wrong')).rejects.toThrow('bad credentials')
    })
    expect(result.current.user).toBeNull()
    expect(getToken()).toBeNull()
  })

  it('logout clears the token and the user', async () => {
    saveToken(validToken('user'))
    const { result } = renderHook(() => useAuth(), { wrapper })
    act(() => result.current.logout())
    expect(result.current.user).toBeNull()
    expect(getToken()).toBeNull()
  })

  it('register creates the account and then logs in', async () => {
    registerRequest.mockResolvedValue({ id: 1, email: 'a@b.com', role: 'user' })
    loginRequest.mockResolvedValue(validToken('user'))
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {
      await result.current.register('a@b.com', 'StrongPass1')
    })
    expect(registerRequest).toHaveBeenCalledWith('a@b.com', 'StrongPass1')
    expect(loginRequest).toHaveBeenCalledWith('a@b.com', 'StrongPass1')
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('useAuth throws when used outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useAuth())).toThrow()
  })
})