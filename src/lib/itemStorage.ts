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
import type { Luggage } from '@/types/luggage'

function itemsCollection() {
  return collection(db, 'users', requireUid(), 'items')
}

function luggagesCollection() {
  return collection(db, 'users', requireUid(), 'luggages')
}

export function genId(): string {
  return crypto.randomUUID()
}

export function createItem(
  title: string,
  weight: number | undefined,
  order: number,
  count: number,
  luggageId: string,
): PackingItem {
  return {
    id: genId(),
    title,
    count,
    weight,
    luggageId,
    order,
    lastModified: Date.now(),
  }
}

export function createLuggage(name: string, order = 0): Luggage {
  return {
    id: genId(),
    name,
    order,
    lastModified: Date.now(),
  }
}

export function nextOrder<T extends { order: number }>(list: T[]): number {
  return list.reduce((max, entry) => Math.max(max, entry.order), -1) + 1
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

/** Field-wise equality, ignoring `lastModified` — used to skip no-op writes. */
export function sameItem(a: PackingItem, b: PackingItem): boolean {
  return (
    a.title === b.title &&
    a.count === b.count &&
    a.weight === b.weight &&
    a.luggageId === b.luggageId &&
    a.order === b.order &&
    a.groupId === b.groupId &&
    a.groupColor === b.groupColor
  )
}

export async function deleteItem(id: string): Promise<void> {
  await deleteDoc(doc(itemsCollection(), id))
}

export async function getAllLuggages(): Promise<Luggage[]> {
  const snap = await getDocs(luggagesCollection())
  return snap.docs
    .map((d) => d.data() as Luggage)
    .sort((a, b) => (a.order ?? a.lastModified) - (b.order ?? b.lastModified))
}

export async function saveLuggage(luggage: Luggage): Promise<void> {
  const toSave: Luggage = { ...luggage, lastModified: Date.now() }
  await setDoc(doc(luggagesCollection(), luggage.id), toSave)
}

export async function deleteLuggage(id: string): Promise<void> {
  await deleteDoc(doc(luggagesCollection(), id))
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
