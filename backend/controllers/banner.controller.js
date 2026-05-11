const db = require('../config/db')

const DEFAULT_BANNERS = [
  {
    text: 'Khai trương - Giảm 20% tất cả món',
    bg: '#ffe8d6',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  },
  {
    text: 'Combo trưa đặc biệt chỉ từ 59.000đ',
    bg: '#d6f0e0',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
  },
  {
    text: 'Món mới tháng này - Thử ngay!',
    bg: '#d6e8ff',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
  },
]

async function ensureBannerTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS banners (
      id INT NOT NULL AUTO_INCREMENT,
      text VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      bg VARCHAR(20) COLLATE utf8mb4_unicode_ci DEFAULT '#ffe8d6',
      image VARCHAR(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  const [[countRow]] = await db.query('SELECT COUNT(*) AS total FROM banners')
  if (Number(countRow.total) > 0) return

  const values = DEFAULT_BANNERS.map((banner, index) => [
    banner.text,
    banner.bg,
    banner.image,
    index,
  ])

  await db.query(
    'INSERT INTO banners (text, bg, image, sort_order) VALUES ?',
    [values]
  )
}

function normalizeBanner(banner, index) {
  const text = String(banner.text || '').trim()
  const bg = String(banner.bg || '').trim()
  const image = String(banner.image || '').trim()

  return {
    text,
    bg: /^#[0-9a-fA-F]{6}$/.test(bg) ? bg : '#ffe8d6',
    image,
    sort_order: index,
  }
}

function mapBanner(row) {
  return {
    id: row.id,
    text: row.text || '',
    bg: row.bg || '#ffe8d6',
    image: row.image || '',
  }
}

const getBanners = async (req, res) => {
  try {
    await ensureBannerTable()

    const [rows] = await db.query(
      'SELECT id, text, bg, image FROM banners ORDER BY sort_order ASC, id ASC'
    )

    res.json(rows.map(mapBanner))
  } catch (error) {
    res.status(500).json({ message: 'Không thể tải banner', error: error.message })
  }
}

const updateBanners = async (req, res) => {
  try {
    const { banners } = req.body

    if (!Array.isArray(banners)) {
      return res.status(400).json({ message: 'Dữ liệu banner không hợp lệ' })
    }

    const normalized = banners
      .map(normalizeBanner)
      .filter((banner) => banner.text || banner.image)
      .slice(0, 8)

    if (normalized.length === 0) {
      return res.status(400).json({ message: 'Cần ít nhất 1 banner có nội dung hoặc hình ảnh' })
    }

    await ensureBannerTable()

    await db.query('DELETE FROM banners')
    await db.query(
      'INSERT INTO banners (text, bg, image, sort_order) VALUES ?',
      [normalized.map((banner) => [
        banner.text || null,
        banner.bg,
        banner.image || null,
        banner.sort_order,
      ])]
    )

    const [rows] = await db.query(
      'SELECT id, text, bg, image FROM banners ORDER BY sort_order ASC, id ASC'
    )

    res.json({ message: 'Cập nhật banner thành công', banners: rows.map(mapBanner) })
  } catch (error) {
    res.status(500).json({ message: 'Không thể cập nhật banner', error: error.message })
  }
}

module.exports = {
  getBanners,
  updateBanners,
}
