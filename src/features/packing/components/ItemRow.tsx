import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, Eye, EyeOff, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { NumberStepper } from '@/features/packing/components/NumberStepper'
import { formatWeight, weightColorClass } from '@/lib/itemStorage'
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

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(item.title)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled: dragDisabled })

  const startEditTitle = () => {
    setTitleDraft(item.title)
    setEditingTitle(true)
  }

  const commitTitle = () => {
    const trimmed = titleDraft.trim()
    if (trimmed && trimmed !== item.title) {
      onUpdate({ ...item, title: trimmed })
    }
    setEditingTitle(false)
  }

  const cancelTitle = () => {
    setTitleDraft(item.title)
    setEditingTitle(false)
  }

  const handleTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitTitle()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelTitle()
    }
  }

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

  const toggleHidden = () => {
    onUpdate({ ...item, hidden: !item.hidden })
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        className={cn(
          'flex items-center gap-1 border-b py-2 last:border-b-0 touch-none select-none',
          isDragging && 'relative z-10 bg-background opacity-80',
          item.hidden && 'opacity-50',
        )}
        {...(dragDisabled ? {} : attributes)}
        {...(dragDisabled ? {} : listeners)}
      >
        <div className="flex flex-1 items-center gap-1 rounded-md px-2 py-1">
          {editingTitle ? (
            <div className="flex flex-1 items-center gap-1">
              <input
                ref={titleInputRef}
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                onBlur={commitTitle}
                className="flex-1 truncate rounded-md border border-input bg-background px-1 py-0.5 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={commitTitle}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Check className="size-4" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={cancelTitle}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startEditTitle}
              className="flex-1 truncate rounded-md border border-transparent px-1 py-0.5 text-left text-sm hover:border-input hover:bg-accent"
            >
              {item.title}
            </button>
          )}

          <button
            type="button"
            onClick={openDialog}
            className="flex items-center gap-1 rounded-md px-1 py-1 hover:bg-accent"
          >
            <span className="w-[108px] text-center text-sm text-muted-foreground">
              {item.count > 1 ? `x${item.count}` : ''}
            </span>
            <span
              className={cn(
                'w-[108px] text-center text-sm',
                item.weight !== undefined
                  ? weightColorClass(item.weight * item.count)
                  : 'text-muted-foreground',
                item.hidden && 'opacity-50',
              )}
            >
              {item.weight !== undefined
                ? formatWeight(item.weight * item.count)
                : ''}
            </span>
          </button>

          <button
            type="button"
            onClick={toggleHidden}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            title={item.hidden ? 'Excluded from totals' : 'Included in totals'}
          >
            {item.hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
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
