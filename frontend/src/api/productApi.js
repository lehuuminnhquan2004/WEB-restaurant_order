import instance from './axios'

const productApi = {
  getAll: (params) => instance.get('/products', { params }),
  getById: (id) => instance.get(`/products/${id}`),
  create: (data) => instance.post('/products', data),
  update: (id, data) => instance.put(`/products/${id}`, data),
  delete: (id) => instance.delete(`/products/${id}`),
}

export default productApi