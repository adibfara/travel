import { useContext } from 'react'
import { AuthContext } from '@/shared/auth/AuthProvider'

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth() must be used within AuthProvider')
  return ctx
}
