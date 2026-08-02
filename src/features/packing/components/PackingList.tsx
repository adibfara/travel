import { useState } from 'react'
import { Plane, LogOut } from 'lucide-react'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/shared/theme/ThemeToggle'
import { useAuth } from '@/shared/auth/useAuth'
import { usePackingItems } from '@/features/packing/hooks/usePackingItems'
import { ItemRow } from '@/features/packing/components/ItemRow'
import { TotalsBar } from '@/features/packing/components/TotalsBar'
import { ImportExportBar } from '@/features/packing/components/ImportExportBar'
import {
  ListHeader,
  type SortDir,
  type SortKey,
} from '@/features/packing/components/ListHeader'
import { totalWeight, totalCount, hiddenWeight } from '@/lib/itemStorage'

export function PackingList() {
  const { signOut } = useAuth()
  const {
    items,
    loading,
    addItem,
    updateItem,
    removeItem,
    importItems,
    reorderItems,
  } = usePackingItems()

  const [sortKey, setSortKey] = useState<SortKey>('default')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const handleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir('desc')
    } else if (sortDir === 'desc') {
      setSortDir('asc')
    } else {
      setSortKey('default')
    }
  }

  const sortedItems =
    sortKey === 'default'
      ? items
      : [...items].sort((a, b) => {
          const diff =
            (a[sortKey] ?? 0) * a.count - (b[sortKey] ?? 0) * b.count
          return sortDir === 'asc' ? diff : -diff
        })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 400, tolerance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 400, tolerance: 8 },
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    void reorderItems(arrayMove(items, oldIndex, newIndex))
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4">
      <header className="flex items-center justify-between gap-2 py-4">
        <div className="flex items-center gap-2">
          <Plane className="size-5 text-primary" />
          <h1 className="text-lg font-semibold">Travel Planner</h1>
        </div>
        <div className="flex items-center gap-1">
          <ImportExportBar items={items} onImport={importItems} />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            onClick={() => void signOut()}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No items yet. Add your first one below.
          </p>
        ) : (
          <>
            <ListHeader sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedItems.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                {sortedItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onUpdate={updateItem}
                    onDelete={removeItem}
                    dragDisabled={sortKey !== 'default'}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </>
        )}
      </div>

      <TotalsBar
        items={sortedItems}
        count={totalCount(items)}
        weight={totalWeight(items)}
        hiddenWeight={hiddenWeight(items)}
        onAdd={addItem}
      />
    </div>
  )
}
