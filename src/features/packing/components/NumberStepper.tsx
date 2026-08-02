import { Minus, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NumberStepperProps {
  value: string
  onChange: (value: string) => void
  step: number
  min?: number
  placeholder?: string
  className?: string
  inputClassName?: string
}

export function NumberStepper({
  value,
  onChange,
  step,
  min = 0,
  placeholder,
  className,
  inputClassName,
}: NumberStepperProps) {
  const bump = (delta: number) => {
    const current = value ? Number(value) : min
    const next = Math.max(min, Math.round((current + delta) * 100) / 100)
    onChange(next === 0 ? '' : String(next))
  }

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Decrease"
        className="size-7 shrink-0"
        onClick={() => bump(-step)}
      >
        <Minus className="size-3" />
      </Button>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type="number"
        inputMode="decimal"
        min={min}
        step="any"
        className={cn(
          'w-12 border-transparent px-1 text-center shadow-none hover:border-input focus-visible:border-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          inputClassName,
        )}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Increase"
        className="size-7 shrink-0"
        onClick={() => bump(step)}
      >
        <Plus className="size-3" />
      </Button>
    </div>
  )
}
