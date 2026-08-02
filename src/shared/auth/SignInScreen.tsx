import { Plane } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/shared/auth/useAuth'
import { toast } from 'sonner'

export function SignInScreen() {
  const { signIn } = useAuth()

  const handleSignIn = async () => {
    try {
      await signIn()
    } catch {
      toast.error('Sign-in failed. Please try again.')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <Plane className="size-10 text-primary" />
        <h1 className="text-2xl font-semibold">Travel Planner</h1>
        <p className="text-sm text-muted-foreground">
          Pack smart. Track weight and size at a glance.
        </p>
      </div>
      <Button onClick={handleSignIn} size="lg">
        Sign in with Google
      </Button>
    </div>
  )
}
