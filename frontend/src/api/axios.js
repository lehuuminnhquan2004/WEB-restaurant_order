import axios from 'axios'
import useAuthStore from '../store/authStore'

function getAuthToken() {
  const stateToken = useAuthStore.getState().token
  if (stateToken) {
    return stateToken
  }

  const persisted = localStorage.getItem('auth-storage')
  if (!persisted) {
    return null
  }

  try {
    return JSON.parse(persisted)?.state?.token ?? null
  } catch {
    return null
  }
}

const instance = axios.create({
  baseURL: 'http://localhost:5000/api',
})

instance.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url ?? ''

      if (!requestUrl.includes('/auth/login')) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default instance
