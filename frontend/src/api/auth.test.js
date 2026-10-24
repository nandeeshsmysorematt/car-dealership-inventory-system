import { beforeEach, describe, expect, it, vi } from 'vitest'
import client from './client'
import { loginRequest, registerRequest } from './auth'

vi.mock('./client', () => ({ default: { post: vi.fn() } }))

beforeEach(() => vi.resetAllMocks())

describe('loginRequest', () => {
  it('posts the credentials and returns the access token', async () => {
    client.post.mockResolvedValue({ data: { access_token: 'tok', token_type: 'bearer' } })
    const token = await loginRequest('a@b.com', 'pw')
    expect(client.post).toHaveBeenCalledWith('/api/auth/login', { email: 'a@b.com', password: 'pw' })
    expect(token).toBe('tok')
  })
})

describe('registerRequest', () => {
  it('posts the new account and returns the created user', async () => {
    client.post.mockResolvedValue({ data: { id: 1, email: 'a@b.com', role: 'user' } })
    const user = await registerRequest('a@b.com', 'StrongPass1')
    expect(client.post).toHaveBeenCalledWith('/api/auth/register', {
      email: 'a@b.com',
      password: 'StrongPass1',
    })
    expect(user.role).toBe('user')
  })
})