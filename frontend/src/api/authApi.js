import instance from './axios'

const authApi = {
  login: (data) => instance.post('/auth/login', data),
}

export default authApi