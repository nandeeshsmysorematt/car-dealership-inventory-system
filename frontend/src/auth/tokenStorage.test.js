import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearToken,
  decodeToken,
  getToken,
  isTokenExpired,
  saveToken,
} from './tokenStorage'

// Builds a fake (unsigned) JWT so we can test decoding without a server.
function makeToken(payload) {
  const encode = (obj) =>
    btoa(JSON.stringify(obj))
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`
}

const now = () => Math.floor(Date.now() / 1000)

beforeEach(() => localStorage.clear())

describe('token storage', () => {
  it('returns null when nothing is stored', () => {
    expect(getToken()).toBeNull()
  })

  it('saves and reads back a token', () => {
    saveToken('abc.def.ghi')
    expect(getToken()).toBe('abc.def.ghi')
  })

  it('clears the token', () => {
    saveToken('abc.def.ghi')
    clearToken()
    expect(getToken()).toBeNull()
  })
})

describe('decodeToken', () => {
  it('reads the user id and role from the payload', () => {
    const token = makeToken({ sub: '7', role: 'admin', exp: now() + 3600 })
    expect(decodeToken(token)).toMatchObject({ userId: 7, role: 'admin' })
  })

  it('returns null for a malformed token', () => {
    expect(decodeToken('not-a-token')).toBeNull()
  })

  it('returns null when there is no token', () => {
    expect(decodeToken(null)).toBeNull()
    expect(decodeToken(undefined)).toBeNull()
  })
})

describe('isTokenExpired', () => {
  it('is false for a token that expires in the future', () => {
    expect(isTokenExpired(makeToken({ sub: '1', role: 'user', exp: now() + 3600 }))).toBe(false)
  })

  it('is true for a token that has already expired', () => {
    expect(isTokenExpired(makeToken({ sub: '1', role: 'user', exp: now() - 10 }))).toBe(true)
  })

  it('is true for a malformed token', () => {
    expect(isTokenExpired('garbage')).toBe(true)
  })
})