import instance from './axios'

const paymentApi = {
  getTransferSettings: () => instance.get('/payments/transfer-settings'),
  updateTransferSettings: (data) => instance.put('/payments/transfer-settings', data),
  createRequest: (data) => instance.post('/payments/requests', data),
  getPendingRequests: () => instance.get('/payments/requests'),
  completeRequest: (id) => instance.put(`/payments/requests/${id}/complete`),
}

export default paymentApi
