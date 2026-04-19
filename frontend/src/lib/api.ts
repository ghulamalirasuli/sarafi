import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL ?? '/api'

export const api = axios.create({
  baseURL,
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sarafi_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sarafi_token')
      localStorage.removeItem('sarafi_user')
    }
    return Promise.reject(err)
  },
)

export type ApiUser = {
  id: number
  uid: string
  fullname: string
  username: string
  email: string | null
  mobile: string | null
  role: string
  branch_id: number | null
  customer_id: number | null
  is_active: boolean
}
