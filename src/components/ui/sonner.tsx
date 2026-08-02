import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { useTheme } from '@/shared/theme/useTheme'

function Toaster(props: ToasterProps) {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme === 'system' ? 'system' : theme}
      className="toaster group"
      {...props}
    />
  )
}

export { Toaster }
