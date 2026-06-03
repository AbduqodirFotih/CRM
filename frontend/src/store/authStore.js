import { create } from 'zustand'
import api from '../api'

const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  user: null,
  loading: false,

  login: async (email, password) => {
    const params = new URLSearchParams()
    params.append('username', email)
    params.append('password', password)
    const { data } = await api.post('/api/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    localStorage.setItem('token', data.access_token)
    api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`
    set({ token: data.access_token })
    // fetch user
    const userResp = await api.get('/api/auth/me')
    set({ user: userResp.data })
  },

  fetchUser: async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    try {
      const { data } = await api.get('/api/auth/me')
      set({ user: data, token })
    } catch {
      localStorage.removeItem('token')
      set({ token: null, user: null })
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    set({ token: null, user: null })
  }
}))

export default useAuthStore
