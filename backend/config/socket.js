let ioInstance = null

function setSocketIo(io) {
  ioInstance = io
}

function emitOrdersChanged(payload = {}) {
  if (!ioInstance) return
  ioInstance.emit('orders:changed', payload)
}

function emitChatChanged(payload = {}) {
  if (!ioInstance) return
  ioInstance.emit('chat:changed', payload)
}

function emitPaymentsChanged(payload = {}) {
  if (!ioInstance) return
  ioInstance.emit('payments:changed', payload)
}

module.exports = {
  setSocketIo,
  emitOrdersChanged,
  emitChatChanged,
  emitPaymentsChanged,
}
