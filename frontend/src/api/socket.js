import { io } from 'socket.io-client'

function getSocketUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  return apiUrl.replace(/\/api\/?$/, '')
}

const socket = io(getSocketUrl(), {
  autoConnect: false,
  transports: ['websocket', 'polling'],
})

export default socket
