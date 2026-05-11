import instance from './axios'

const bannerApi = {
  getAll: () => instance.get('/banners'),
  updateAll: (banners) => instance.put('/banners', { banners }),
}

export default bannerApi
