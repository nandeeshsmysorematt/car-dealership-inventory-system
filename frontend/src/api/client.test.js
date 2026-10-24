import { beforeEach, describe, expect, it } from 'vitest'
import { saveToken } from '../auth/tokenStorage'
import { attachAuthHeader } from './client'

beforeEach(() => localStorage.clear())

describe('attachAuthHeader', () => {
  it('adds a Bearer header when a token is stored', () => {
    saveToken('abc.def.ghi')
    const config = attachAuthHeader({ headers: {} })
    expect(config.headers.Authorization).toBe('Bearer abc.def.ghi')
  })

  it('adds no Authorization header when logged out', () => {
    const config = attachAuthHeader({ headers: {} })
    expect(config.headers.Authorization).toBeUndefined()
  })

  it('works when the request has no headers object yet', () => {
    saveToken('abc.def.ghi')
    const config = attachAuthHeader({})
    expect(config.headers.Authorization).toBe('Bearer abc.def.ghi')
  })
})