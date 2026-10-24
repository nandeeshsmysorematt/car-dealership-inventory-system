// Keeps the JWT in the browser so the user stays logged in after a refresh.
const TOKEN_KEY = 'access_token'

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// Reads the (unverified) payload of a JWT. The server is the real authority:
// this is only used to decide what the UI should show.
export function decodeToken(token) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const payload = JSON.parse(atob(padded))
    return { userId: Number(payload.sub), role: payload.role, exp: payload.exp }
  } catch {
    return null
  }
}

export function isTokenExpired(token) {
  const decoded = decodeToken(token)
  if (!decoded || typeof decoded.exp !== 'number') return true
  return decoded.exp * 1000 <= Date.now()
}
