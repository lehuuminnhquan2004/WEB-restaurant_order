import instance from './axios'

const authApi = {
  login: ({ username, password }) =>
    instance.post('/auth/login', { username, password }),
}

export default authApi