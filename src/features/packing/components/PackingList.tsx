import { useEffect, useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/shared/theme/ThemeToggle'
import { useAuth } from '@/shared/auth/useAuth'
import { usePackingItems } from '@/features/packing/hooks/usePackingItems'
import { LuggageColumn } from '@/features/packing/components/LuggageColumn'
import { TotalsBar } from '@/features/packing/components/TotalsBar'
import { ImportExportBar } from '@/features/packing/components/ImportExportBar'
import { AddLuggageDialog } from '@/features/packing/components/AddLuggageDialog'
import type { SortDir, SortKey } from '@/features/packing/components/ListHeader'
import { totalWeight, totalCount } from '@/lib/itemStorage'
import type { PackingItem } from '@/types/item'

export function PackingList() {
  const { signOut } = useAuth()
  const {
    items,
    luggages,
    loading,
    addItem,
    updateItem,
    removeItem,
    importItems,
    reorderItems,
    moveItem,
    addLuggage,
    updateLuggage,
  } = usePackingItems()

  const [sortKey, setSortKey] = useState<SortKey>('default')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selectedLuggageId, setSelectedLuggageId] = useState('')

  useEffect(() => {
    if (!selectedLuggageId && luggages.length > 0) {
      setSelectedLuggageId(luggages[luggages.length - 1].id)
    }
  }, [luggages, selectedLuggageId])

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

  const sortItems = (subset: PackingItem[]) =>
    sortKey === 'default'
      ? subset
      : [...subset].sort((a, b) => {
          const diff =
            (a[sortKey] ?? 0) * a.count - (b[sortKey] ?? 0) * b.count
          return sortDir === 'asc' ? diff : -diff
        })

  const itemsByLuggage = (luggageId: string) =>
    sortItems(
      items
        .filter((i) => i.luggageId === luggageId)
        .sort((a, b) => a.order - b.order),
    )

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
    if (!over) return
    const activeItem = items.find((i) => i.id === active.id)
    if (!activeItem) return

    const overId = String(over.id)
    const overLuggage = luggages.find((l) => l.id === overId)
    const overItem = items.find((i) => i.id === overId)
    const targetLuggageId = overLuggage?.id ?? overItem?.luggageId
    if (!targetLuggageId) return

    const destination = items
      .filter((i) => i.luggageId === targetLuggageId && i.id !== activeItem.id)
      .sort((a, b) => a.order - b.order)

    let insertIndex = destination.length
    if (overItem && overItem.id !== activeItem.id) {
      const foundIndex = destination.findIndex((i) => i.id === overItem.id)
      if (foundIndex !== -1) insertIndex = foundIndex
    }
    destination.splice(insertIndex, 0, { ...activeItem, luggageId: targetLuggageId })
    void reorderItems(destination)
  }

  const handleImport = (entries: Parameters<typeof importItems>[0]) =>
    importItems(entries, selectedLuggageId)

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="flex items-center justify-between gap-2 px-4 py-4">
        <div className="flex items-center gap-2">
          <Plane className="size-5 text-primary" />
          <h1 className="text-lg font-semibold">Travel Planner</h1>
        </div>
        <div className="flex items-center gap-1">
          <AddLuggageDialog onAdd={addLuggage} onCreated={(l) => setSelectedLuggageId(l.id)} />
          <ImportExportBar items={items} luggages={luggages} onImport={handleImport} />
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
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="overflow-x-auto px-4 pb-4">
              <div className="mx-auto flex w-max flex-row gap-4">
                {luggages.map((luggage) => (
                  <LuggageColumn
                    key={luggage.id}
                    luggage={luggage}
                    luggages={luggages}
                    items={itemsByLuggage(luggage.id)}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                    onUpdateItem={updateItem}
                    onDeleteItem={removeItem}
                    onMoveItem={(item, targetLuggageId) => void moveItem(item, targetLuggageId)}
                    onRenameLuggage={(l) => void updateLuggage(l)}
                    dragDisabled={sortKey !== 'default'}
                  />
                ))}
              </div>
            </div>
          </DndContext>
        )}
      </div>

      <TotalsBar
        items={items}
        luggages={luggages}
        count={totalCount(items)}
        weight={totalWeight(items)}
        selectedLuggageId={selectedLuggageId}
        onSelectLuggage={setSelectedLuggageId}
        onAdd={addItem}
      />
    </div>
  )
}
