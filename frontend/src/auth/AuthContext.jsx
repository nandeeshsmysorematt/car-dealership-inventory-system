/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { loginRequest, registerRequest } from '../api/auth'
import { clearToken, decodeToken, getToken, isTokenExpired, saveToken } from './tokenStorage'

const AuthContext = createContext(null)

// Restores the session from a stored token, discarding it if it has expired.
function loadUser() {
  const token = getToken()
  if (!token) return null
  if (isTokenExpired(token)) {
    clearToken()
    return null
  }
  return decodeToken(token)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)

  const login = useCallback(async (email, password) => {
    const token = await loginRequest(email, password)
    saveToken(token)
    setUser(decodeToken(token))
  }, [])

  const register = useCallback(
    async (email, password) => {
      await registerRequest(email, password)
      await login(email, password)
    },
    [login],
  )

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
    }),
    [user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an AuthProvider')
  return context
}