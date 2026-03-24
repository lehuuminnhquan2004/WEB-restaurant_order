import instance from './axios'

const categoryApi = {
  getAll: () => instance.get('/categories'),
  create: (data) => instance.post('/categories', data),
  update: (id, data) => instance.put(`/categories/${id}`, data),
  delete: (id) => instance.delete(`/categories/${id}`),
}

export default categoryApi