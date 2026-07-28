import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'
import { getRoleHome } from './roleConfig.js'

export function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleHome(user.role)} replace />
  }

  return children
}