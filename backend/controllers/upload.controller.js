const fs = require('fs/promises')
const path = require('path')
const crypto = require('crypto')

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'images')
const MAX_SIZE_BYTES = 5 * 1024 * 1024
const MIME_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

function getSafeName(filename = 'image') {
  return path
    .basename(filename)
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'image'
}

const uploadImage = async (req, res) => {
  try {
    const { filename, dataUrl } = req.body

    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ message: 'Thiếu dữ liệu ảnh' })
    }

    const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([a-zA-Z0-9+/=]+)$/)
    if (!match) {
      return res.status(400).json({ message: 'Định dạng ảnh không hợp lệ' })
    }

    const mime = match[1]
    const extension = MIME_EXTENSIONS[mime]
    const buffer = Buffer.from(match[2], 'base64')

    if (buffer.length > MAX_SIZE_BYTES) {
      return res.status(400).json({ message: 'Ảnh không được vượt quá 5MB' })
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true })

    const safeName = getSafeName(filename)
    const storedName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${safeName}.${extension}`
    const targetPath = path.join(UPLOAD_DIR, storedName)

    await fs.writeFile(targetPath, buffer)

    const url = `${req.protocol}://${req.get('host')}/uploads/images/${storedName}`
    res.status(201).json({
      message: 'Tải ảnh lên thành công',
      url,
      filename: storedName,
    })
  } catch (error) {
    res.status(500).json({ message: 'Không thể tải ảnh lên', error: error.message })
  }
}

module.exports = {
  uploadImage,
}
