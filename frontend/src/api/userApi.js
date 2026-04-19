import instance from './axios'

const userApi = {
  getAll: (params) => instance.get('/users', { params }),
  create: (data) => instance.post('/users', data),
  update: (id, data) => instance.put(`/users/${id}`, data),
  delete: (id) => instance.delete(`/users/${id}`),
}

export default userApi
