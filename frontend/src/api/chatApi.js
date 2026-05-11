import instance from './axios'

const chatApi = {
  getByTable: (tableId) => instance.get(`/chats/table/${tableId}`),
  sendCustomer: (data) => instance.post('/chats/customer', data),
  getConversations: () => instance.get('/chats/conversations'),
  sendStaff: (data) => instance.post('/chats/staff', data),
}

export default chatApi
