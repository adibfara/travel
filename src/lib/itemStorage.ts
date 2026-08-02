import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { db, requireUid } from '@/lib/firebase'
import type { PackingItem } from '@/types/item'

function itemsCollection() {
  return collection(db, 'users', requireUid(), 'items')
}

export function genId(): string {
  return crypto.randomUUID()
}

export function createItem(
  title: string,
  weight?: number,
  order = 0,
  count = 1,
): PackingItem {
  return {
    id: genId(),
    title,
    count,
    weight,
    order,
    lastModified: Date.now(),
  }
}

export function nextOrder(items: PackingItem[]): number {
  return items.reduce((max, item) => Math.max(max, item.order), -1) + 1
}

export async function getAllItems(): Promise<PackingItem[]> {
  const snap = await getDocs(itemsCollection())
  return snap.docs
    .map((d) => d.data() as PackingItem)
    .sort((a, b) => (a.order ?? a.lastModified) - (b.order ?? b.lastModified))
}

export async function saveItem(item: PackingItem): Promise<void> {
  const toSave: PackingItem = { ...item, lastModified: Date.now() }
  await setDoc(doc(itemsCollection(), item.id), toSave)
}

export async function saveItems(items: PackingItem[]): Promise<void> {
  const batch = writeBatch(db)
  const now = Date.now()
  for (const item of items) {
    batch.set(doc(itemsCollection(), item.id), { ...item, lastModified: now })
  }
  await batch.commit()
}

export async function deleteItem(id: string): Promise<void> {
  await deleteDoc(doc(itemsCollection(), id))
}

export function totalWeight(items: PackingItem[]): number {
  return items.reduce((sum, item) => sum + (item.weight ?? 0) * item.count, 0)
}

export function totalCount(items: PackingItem[]): number {
  return items.reduce((sum, item) => sum + item.count, 0)
}

export function formatWeight(kg: number): string {
  return kg > 0 && kg < 1
    ? `${Math.round(kg * 1000)} g`
    : `${kg.toFixed(1)} kg`
}

export function weightColorClass(kg: number): string {
  if (kg < 0.15) return 'text-muted-foreground/50'
  if (kg < 0.5) return 'text-muted-foreground'
  if (kg < 3) return 'text-foreground/70 font-medium'
  return 'text-foreground font-bold'
}
