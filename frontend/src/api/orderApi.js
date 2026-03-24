import instance from './axios'

const orderApi = {
  create: (data) => instance.post('/orders', data),
  getAll: (params) => instance.get('/orders', { params }),
  getByTable: (tableId) => instance.get(`/orders/table/${tableId}`),
  updateStatus: (id, status) => instance.put(`/orders/${id}/status`, { status }),
  updateItemStatus: (orderId, itemId, status) =>
    instance.put(`/orders/${orderId}/items/${itemId}/status`, { status }),
  removeItem: (orderId, itemId) =>
    instance.delete(`/orders/${orderId}/items/${itemId}`),
}

export default orderApi