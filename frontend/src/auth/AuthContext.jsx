import { createContext, useContext, useMemo, useState } from 'react'
import { clearAuthUser, readAuthUser, writeAuthUser } from '../shared/authStorage.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readAuthUser())

  const value = useMemo(
    () => ({
      user,
      login: (nextUser) => {
        const safeUser = { ...nextUser, authenticatedAt: new Date().toISOString() }
        setUser(safeUser)
        writeAuthUser(safeUser)
      },
      logout: () => {
        clearAuthUser()
        setUser(null)
      },
      updateUser: (updates) => {
        setUser((prev) => {
          const nextUser = { ...prev, ...updates }
          writeAuthUser(nextUser)
          return nextUser
        })
      },
    }),
    [user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}