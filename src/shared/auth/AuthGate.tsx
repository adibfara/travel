import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/shared/auth/useAuth'
import { SignInScreen } from '@/shared/auth/SignInScreen'

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return <SignInScreen />
  }

  return <>{children}</>
}
