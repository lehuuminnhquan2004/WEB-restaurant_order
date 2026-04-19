import {Navigate, Outlet} from 'react-router-dom'
import useAuthStore from '../../store/authStore'


function ProtectedRoute({roles = []}){
    const {token, user, isLoggedIn, logout}=useAuthStore()

    if(!token||!user||!isLoggedIn()){
        logout();
        return <Navigate to="/login" replace />
    }

    // Đã đăng nhập nhưng sai role → về login
    if (!roles.includes(user.role)) {
        return <Navigate to="/login" replace />
    }
    
    // Hợp lệ → render children
    return <Outlet />
}

export default ProtectedRoute