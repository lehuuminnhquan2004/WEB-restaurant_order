import instance from './axios'

const tableApi = {
  getAll: () => instance.get('/tables'),
  create: (data) => instance.post('/tables', data),
  update: (id, data) => instance.put(`/tables/${id}`, data),
  delete: (id) => instance.delete(`/tables/${id}`),
  reset: (id) => instance.post(`/tables/${id}/reset`),
  verify: (token) => instance.get(`/tables/verify/${token}`),
}

export default tableApi