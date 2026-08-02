import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { NumberStepper } from '@/features/packing/components/NumberStepper'

interface AddItemRowProps {
  onAdd: (title: string, weight?: number, count?: number) => void
}

export function AddItemRow({ onAdd }: AddItemRowProps) {
  const [title, setTitle] = useState('')
  const [count, setCount] = useState('1')
  const [weight, setWeight] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onAdd(
      trimmed,
      weight ? Number(weight) : undefined,
      count ? Number(count) : 1,
    )
    setTitle('')
    setCount('1')
    setWeight('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add an item…"
        className="flex-1"
      />
      <NumberStepper value={count} onChange={setCount} step={1} min={1} placeholder="qty" />
      <NumberStepper value={weight} onChange={setWeight} step={0.2} placeholder="kg" />
      <Button type="submit" size="icon" aria-label="Add item">
        <Plus className="size-4" />
      </Button>
    </form>
  )
}
