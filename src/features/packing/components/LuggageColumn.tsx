import { useRef, useState, type KeyboardEvent } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Check, X } from 'lucide-react'
import { ItemRow } from '@/features/packing/components/ItemRow'
import {
  ListHeader,
  type SortDir,
  type SortKey,
} from '@/features/packing/components/ListHeader'
import { formatWeight, totalCount, totalWeight } from '@/lib/itemStorage'
import type { PackingItem } from '@/types/item'
import type { Luggage } from '@/types/luggage'

interface LuggageColumnProps {
  luggage: Luggage
  luggages: Luggage[]
  items: PackingItem[]
  sortKey: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
  onUpdateItem: (item: PackingItem) => void
  onDeleteItem: (id: string) => void
  onMoveItem: (item: PackingItem, targetLuggageId: string) => void
  onRenameLuggage: (luggage: Luggage) => void
  dragDisabled?: boolean
}

export function LuggageColumn({
  luggage,
  luggages,
  items,
  sortKey,
  sortDir,
  onSort,
  onUpdateItem,
  onDeleteItem,
  onMoveItem,
  onRenameLuggage,
  dragDisabled,
}: LuggageColumnProps) {
  const { setNodeRef } = useDroppable({ id: luggage.id })
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(luggage.name)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const index = luggages.findIndex((l) => l.id === luggage.id)
  const prevLuggage = index > 0 ? luggages[index - 1] : undefined
  const nextLuggage = index < luggages.length - 1 ? luggages[index + 1] : undefined

  const startEditName = () => {
    setNameDraft(luggage.name)
    setEditingName(true)
  }

  const commitName = () => {
    const trimmed = nameDraft.trim()
    if (trimmed && trimmed !== luggage.name) {
      onRenameLuggage({ ...luggage, name: trimmed })
    }
    setEditingName(false)
  }

  const cancelName = () => {
    setNameDraft(luggage.name)
    setEditingName(false)
  }

  const handleNameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitName()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelName()
    }
  }

  return (
    <div ref={setNodeRef} className="flex w-160 shrink-0 flex-col rounded-lg border bg-card/50">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        {editingName ? (
          <div className="flex flex-1 items-center gap-1">
            <input
              ref={nameInputRef}
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={handleNameKeyDown}
              onBlur={commitName}
              className="flex-1 truncate rounded-md border border-input bg-background px-1 py-0.5 text-sm font-semibold outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={commitName}
              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Check className="size-4" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={cancelName}
              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEditName}
            className="flex-1 truncate rounded-md border border-transparent px-1 py-0.5 text-left text-sm font-semibold hover:border-input hover:bg-accent"
          >
            {luggage.name}
          </button>
        )}
        <span className="shrink-0 text-xs text-muted-foreground">
          {totalCount(items)} · {formatWeight(totalWeight(items))}
        </span>
      </div>

      <div className="px-3 pt-2">
        <ListHeader sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
      </div>

      <div className="flex-1 px-3 pb-3">
        {items.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">Empty</p>
        ) : (
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onUpdate={onUpdateItem}
                onDelete={onDeleteItem}
                dragDisabled={dragDisabled}
                onMoveLeft={prevLuggage ? () => onMoveItem(item, prevLuggage.id) : undefined}
                onMoveRight={nextLuggage ? () => onMoveItem(item, nextLuggage.id) : undefined}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  )
}
