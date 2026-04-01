import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { FiUser, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi'
import authApi from '../api/authApi'
import useAuthStore from '../store/authStore'
import '../styles/LoginPage.css'

const ROLE_REDIRECT = {
  admin:   '/admin/products',
  staff:   '/staff/orders',
  kitchen: '/kitchen',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth, token, user } = useAuthStore()

  const [username, setUsername]         = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  if (token && user) {
    return <Navigate to={ROLE_REDIRECT[user.role] || '/login'} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin')
      return
    }

    setLoading(true)
    try {
      const res = await authApi.login({
        username: username.trim(),
        password,
      })
      const { token, user } = res.data
      setAuth(token, user)
      navigate(ROLE_REDIRECT[user.role] || '/login', { replace: true })
    } catch (err) {
      const status = err.response?.status
      if (status === 401 || status === 400) setError('Sai tài khoản hoặc mật khẩu')
      else setError('Lỗi máy chủ, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-accent-bar" />

        <div className="login-body">
          {/* Header */}
          <div className="login-header">
            <div className="login-logo">🍽️</div>
            <h1 className="login-title">Restaurant OS</h1>
            <p className="login-subtitle">Hệ thống quản lý nhà hàng</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Username */}
            <div className="form-group">
              <label className="form-label">Tên đăng nhập</label>
              <div className="input-wrapper">
                <span className="input-icon"><FiUser size={15} /></span>
                <input
                  type="text"
                  className="input input-with-icon"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <div className="input-wrapper">
                <span className="input-icon"><FiLock size={15} /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input input-with-icon input-with-action"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-action"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="login-error">
                <FiAlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-lg login-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Đang đăng nhập...
                </>
              ) : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
