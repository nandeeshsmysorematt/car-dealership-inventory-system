import axios from 'axios'
import { getToken } from '../auth/tokenStorage'

// The backend address comes from the environment, so deployment only needs config.
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

// Adds "Authorization: Bearer <token>" to a request when the user is logged in.
export function attachAuthHeader(config) {
  const token = getToken()
  config.headers = config.headers || {}
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

const client = axios.create({ baseURL: API_URL })
client.interceptors.request.use(attachAuthHeader)

export default client