import axios from 'axios'

const envMode = import.meta.env.VITE_ENV_MODE
const baseURL =
  envMode === 'development'
    ? 'http://localhost:3000'
    : envMode === 'production'
      ? import.meta.env.VITE_API_URL
      : undefined

if (!baseURL) {
  throw new Error(
    `Invalid API configuration: set VITE_ENV_MODE to "development" or "production" and configure VITE_API_URL for production.`,
  )
}

export const api = axios.create({
  baseURL,
})

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('token') || window.sessionStorage.getItem('token')

  if (token) {
    config.headers.authorization = `Bearer ${token}`
  }

  return config
})
