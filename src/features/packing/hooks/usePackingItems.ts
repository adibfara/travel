import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  createItem,
  createLuggage,
  deleteItem,
  getAllItems,
  getAllLuggages,
  nextOrder,
  saveItem,
  saveItems,
  saveLuggage,
} from '@/lib/itemStorage'
import type { PackingItem } from '@/types/item'
import type { Luggage } from '@/types/luggage'

export interface ImportedItem {
  title: string
  count?: number
  weight?: number
  luggage?: string
}

export function usePackingItems() {
  const [items, setItems] = useState<PackingItem[]>([])
  const [luggages, setLuggages] = useState<Luggage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAllItems(), getAllLuggages()])
      .then(async ([loadedItems, loadedLuggages]) => {
        let allLuggages = loadedLuggages
        if (allLuggages.length === 0) {
          const main = createLuggage('Main', 0)
          await saveLuggage(main)
          allLuggages = [main]
        }
        const fallbackId = allLuggages[0].id
        setLuggages(allLuggages)
        setItems(
          loadedItems.map((item) =>
            item.luggageId ? item : { ...item, luggageId: fallbackId },
          ),
        )
      })
      .catch(() => toast.error('Failed to load items'))
      .finally(() => setLoading(false))
  }, [])

  const addItem = async (
    title: string,
    weight: number | undefined,
    count: number,
    luggageId: string,
  ) => {
    const order = nextOrder(items.filter((i) => i.luggageId === luggageId))
    const item = createItem(title, weight, order, count, luggageId)
    setItems((prev) => [...prev, item])
    try {
      await saveItem(item)
    } catch {
      toast.error('Failed to save item')
      setItems((prev) => prev.filter((i) => i.id !== item.id))
    }
  }

  const updateItem = async (updated: PackingItem) => {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
    try {
      await saveItem(updated)
    } catch {
      toast.error('Failed to save changes')
    }
  }

  const removeItem = async (id: string) => {
    const prevItems = items
    setItems((prev) => prev.filter((i) => i.id !== id))
    try {
      await deleteItem(id)
    } catch {
      toast.error('Failed to delete item')
      setItems(prevItems)
    }
  }

  const importItems = async (entries: ImportedItem[], defaultLuggageId: string) => {
    const start: Record<string, number> = {}
    const newItems = entries.map((entry) => {
      const luggageId =
        (entry.luggage &&
          luggages.find(
            (l) => l.name.toLowerCase() === entry.luggage?.toLowerCase(),
          )?.id) ??
        defaultLuggageId
      const order =
        start[luggageId] ??
        nextOrder(items.filter((i) => i.luggageId === luggageId))
      start[luggageId] = order + 1
      return createItem(entry.title, entry.weight, order, entry.count ?? 1, luggageId)
    })
    const prevItems = items
    setItems((prev) => [...prev, ...newItems])
    try {
      await saveItems(newItems)
    } catch {
      toast.error('Failed to import items')
      setItems(prevItems)
      throw new Error('Failed to import items')
    }
  }

  const reorderItems = async (orderedSubset: PackingItem[]) => {
    const prevItems = items
    const reordered = orderedSubset.map((item, i) => ({ ...item, order: i }))
    const reorderedMap = new Map(reordered.map((item) => [item.id, item]))
    setItems((prev) => prev.map((i) => reorderedMap.get(i.id) ?? i))
    try {
      await saveItems(reordered)
    } catch {
      toast.error('Failed to save order')
      setItems(prevItems)
    }
  }

  const moveItem = async (item: PackingItem, targetLuggageId: string) => {
    const destination = items.filter(
      (i) => i.luggageId === targetLuggageId && i.id !== item.id,
    )
    await reorderItems([...destination, { ...item, luggageId: targetLuggageId }])
  }

  const addLuggage = async (name: string): Promise<Luggage> => {
    const luggage = createLuggage(name, nextOrder(luggages))
    setLuggages((prev) => [...prev, luggage])
    try {
      await saveLuggage(luggage)
    } catch {
      toast.error('Failed to save luggage')
      setLuggages((prev) => prev.filter((l) => l.id !== luggage.id))
    }
    return luggage
  }

  const updateLuggage = async (updated: Luggage) => {
    setLuggages((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
    try {
      await saveLuggage(updated)
    } catch {
      toast.error('Failed to save luggage')
    }
  }

  return {
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
  }
}
