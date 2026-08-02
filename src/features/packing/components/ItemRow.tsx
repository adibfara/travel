import { useState, type FormEvent } from 'react'
import { GripVertical } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { NumberStepper } from '@/features/packing/components/NumberStepper'
import { cn } from '@/lib/utils'
import type { PackingItem } from '@/types/item'

interface ItemRowProps {
  item: PackingItem
  onUpdate: (item: PackingItem) => void
  onDelete: (id: string) => void
  dragDisabled?: boolean
}

export function ItemRow({ item, onUpdate, onDelete, dragDisabled }: ItemRowProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(item.title)
  const [count, setCount] = useState(item.count.toString())
  const [weight, setWeight] = useState(item.weight?.toString() ?? '')

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled: dragDisabled })

  const openDialog = () => {
    setTitle(item.title)
    setCount(item.count.toString())
    setWeight(item.weight?.toString() ?? '')
    setOpen(true)
  }

  const handleSave = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onUpdate({
      ...item,
      title: trimmed,
      count: count ? Math.max(1, Number(count)) : 1,
      weight: weight ? Number(weight) : undefined,
    })
    setOpen(false)
  }

  const handleDelete = () => {
    onDelete(item.id)
    setOpen(false)
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        className={cn(
          'flex items-center gap-1 border-b py-2 last:border-b-0',
          isDragging && 'relative z-10 bg-background opacity-80',
        )}
      >
        <button
          type="button"
          aria-label="Drag to reorder"
          disabled={dragDisabled}
          className={cn(
            'touch-none cursor-grab text-muted-foreground active:cursor-grabbing',
            dragDisabled && 'cursor-not-allowed opacity-30',
          )}
          {...(dragDisabled ? {} : attributes)}
          {...(dragDisabled ? {} : listeners)}
        >
          <GripVertical className="size-4" />
        </button>
        <button
          type="button"
          onClick={openDialog}
          className="flex flex-1 items-center gap-1 rounded-md px-2 py-1 text-left hover:bg-accent"
        >
          <span className="flex-1 truncate text-sm">{item.title}</span>
          <span className="w-[108px] text-center text-sm text-muted-foreground">
            {item.count > 1 ? `x${item.count}` : ''}
          </span>
          <span className="w-[108px] text-center text-sm text-muted-foreground">
            {item.weight !== undefined
              ? `${(item.weight * item.count).toFixed(1)} kg`
              : ''}
          </span>
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit item</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                Title
              </label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                Count
              </label>
              <NumberStepper value={count} onChange={setCount} step={1} min={1} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                Weight (kg)
              </label>
              <NumberStepper value={weight} onChange={setWeight} step={0.2} />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button type="button" variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
