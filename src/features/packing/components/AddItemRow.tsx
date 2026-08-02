import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { NumberStepper } from '@/features/packing/components/NumberStepper'
import { cn } from '@/lib/utils'
import type { Luggage } from '@/types/luggage'

interface AddItemRowProps {
  luggages: Luggage[]
  selectedLuggageId: string
  onSelectLuggage: (id: string) => void
  onAdd: (title: string, weight: number | undefined, count: number, luggageId: string) => void
}

export function AddItemRow({
  luggages,
  selectedLuggageId,
  onSelectLuggage,
  onAdd,
}: AddItemRowProps) {
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
      selectedLuggageId,
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
      {luggages.length > 1 && (
        <select
          value={selectedLuggageId}
          onChange={(e) => onSelectLuggage(e.target.value)}
          className={cn(
            'h-9 max-w-24 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
          )}
        >
          {luggages.map((luggage) => (
            <option key={luggage.id} value={luggage.id}>
              {luggage.name}
            </option>
          ))}
        </select>
      )}
      <NumberStepper value={count} onChange={setCount} step={1} min={1} placeholder="qty" />
      <NumberStepper value={weight} onChange={setWeight} step={0.2} placeholder="kg" />
      <Button type="submit" size="icon" aria-label="Add item">
        <Plus className="size-4" />
      </Button>
    </form>
  )
}
