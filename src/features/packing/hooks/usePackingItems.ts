import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  createItem,
  deleteItem,
  getAllItems,
  nextOrder,
  saveItem,
  saveItems,
} from '@/lib/itemStorage'
import type { PackingItem } from '@/types/item'

export interface ImportedItem {
  title: string
  count?: number
  weight?: number
  hidden?: boolean
}

export function usePackingItems() {
  const [items, setItems] = useState<PackingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllItems()
      .then(setItems)
      .catch(() => toast.error('Failed to load items'))
      .finally(() => setLoading(false))
  }, [])

  const addItem = async (title: string, weight?: number, count = 1) => {
    const item = createItem(title, weight, nextOrder(items), count)
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

  const importItems = async (entries: ImportedItem[]) => {
    const start = nextOrder(items)
    const newItems = entries.map((entry, i) =>
      createItem(entry.title, entry.weight, start + i, entry.count ?? 1, entry.hidden),
    )
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

  const reorderItems = async (orderedItems: PackingItem[]) => {
    const prevItems = items
    const reordered = orderedItems.map((item, i) => ({ ...item, order: i }))
    setItems(reordered)
    try {
      await saveItems(reordered)
    } catch {
      toast.error('Failed to save order')
      setItems(prevItems)
    }
  }

  return {
    items,
    loading,
    addItem,
    updateItem,
    removeItem,
    importItems,
    reorderItems,
  }
}
