import instance from './axios'

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

const uploadApi = {
  async uploadImage(file) {
    const dataUrl = await fileToDataUrl(file)
    return instance.post('/uploads/images', {
      filename: file.name,
      dataUrl,
    })
  },
}

export default uploadApi
