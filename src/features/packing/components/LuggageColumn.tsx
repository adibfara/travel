import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Check, X } from 'lucide-react'
import { ItemRow } from '@/features/packing/components/ItemRow'
import {
  ListHeader,
  type SortDir,
  type SortKey,
} from '@/features/packing/components/ListHeader'
import { formatWeight, genId, totalCount, totalWeight } from '@/lib/itemStorage'
import {
  bondRange,
  groupColorCss,
  groupRuns,
  randomGroupColor,
  repairGroups,
} from '@/lib/groups'
import type { PackingItem } from '@/types/item'
import type { Luggage } from '@/types/luggage'

/** How far outside the column a bond gesture may stray before it cancels. */
const BOND_CANCEL_MARGIN = 80

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
  onGroupChange: (items: PackingItem[]) => void
  dragDisabled?: boolean
}

interface BondGesture {
  anchorId: string
  hoverId: string
  outside: boolean
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
  onGroupChange,
  dragDisabled,
}: LuggageColumnProps) {
  const { setNodeRef } = useDroppable({ id: luggage.id })
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(luggage.name)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const columnRef = useRef<HTMLDivElement | null>(null)
  const rowRefs = useRef(new Map<string, HTMLElement>())
  const gesture = useRef<BondGesture | null>(null)
  const [bond, setBond] = useState<BondGesture | null>(null)
  const bonding = bond !== null

  const index = luggages.findIndex((l) => l.id === luggage.id)
  const prevLuggage = index > 0 ? luggages[index - 1] : undefined
  const nextLuggage = index < luggages.length - 1 ? luggages[index + 1] : undefined

  const setRootRef = (el: HTMLDivElement | null) => {
    columnRef.current = el
    setNodeRef(el)
  }

  const registerRow = (itemId: string, el: HTMLElement | null) => {
    if (el) rowRefs.current.set(itemId, el)
    else rowRefs.current.delete(itemId)
  }

  const startBond = (itemId: string) => {
    gesture.current = { anchorId: itemId, hoverId: itemId, outside: false }
    setBond(gesture.current)
  }

  /** Double-click drops this item and every item below it out of the group. */
  const ungroup = (itemId: string) => {
    const item = items.find((i) => i.id === itemId)
    if (!item?.groupId) return
    const index = items.findIndex((i) => i.id === itemId)
    const cleared = new Map(
      items
        .slice(index)
        .filter((i) => i.groupId === item.groupId)
        .map((i) => [i.id, { ...i, groupId: undefined, groupColor: undefined }]),
    )
    // Whatever is left above may now be a lone member, which repairGroups dissolves.
    const repaired = repairGroups(items.map((i) => cleared.get(i.id) ?? i))
    onGroupChange(repaired.filter((i, idx) => i !== items[idx]))
  }

  useEffect(() => {
    if (!bonding) return

    const commitBond = (anchorId: string, hoverId: string) => {
      const anchorIndex = items.findIndex((i) => i.id === anchorId)
      const hoverIndex = items.findIndex((i) => i.id === hoverId)
      if (anchorIndex === -1 || hoverIndex === -1) return
      const { lo, hi } = bondRange(items, anchorIndex, hoverIndex)
      if (hi <= lo) return
      const members = items.slice(lo, hi + 1)
      // Growing or merging keeps the topmost existing group's identity.
      const existing = members.find((m) => m.groupId !== undefined)
      const groupId = existing?.groupId ?? genId()
      const groupColor =
        existing?.groupColor ??
        randomGroupColor(
          items.filter((_, i) => i < lo || i > hi).map((i) => i.groupColor),
        )
      const changed = members
        .filter((m) => m.groupId !== groupId || m.groupColor !== groupColor)
        .map((m) => ({ ...m, groupId, groupColor }))
      if (changed.length > 0) onGroupChange(changed)
    }

    const handleMove = (e: PointerEvent) => {
      const current = gesture.current
      if (!current) return

      let hoverId: string | undefined
      for (const item of items) {
        const rect = rowRefs.current.get(item.id)?.getBoundingClientRect()
        if (rect && e.clientY >= rect.top && e.clientY <= rect.bottom) {
          hoverId = item.id
          break
        }
      }
      if (!hoverId && items.length > 0) {
        const first = rowRefs.current.get(items[0].id)?.getBoundingClientRect()
        const last = rowRefs.current
          .get(items[items.length - 1].id)
          ?.getBoundingClientRect()
        if (first && e.clientY < first.top) hoverId = items[0].id
        else if (last && e.clientY > last.bottom) hoverId = items[items.length - 1].id
      }

      const rect = columnRef.current?.getBoundingClientRect()
      const outside = rect
        ? e.clientX < rect.left - BOND_CANCEL_MARGIN ||
          e.clientX > rect.right + BOND_CANCEL_MARGIN ||
          e.clientY < rect.top - BOND_CANCEL_MARGIN ||
          e.clientY > rect.bottom + BOND_CANCEL_MARGIN
        : false

      const nextHover = hoverId ?? current.hoverId
      if (nextHover === current.hoverId && outside === current.outside) return
      gesture.current = { ...current, hoverId: nextHover, outside }
      setBond(gesture.current)
    }

    const finish = (commit: boolean) => {
      const current = gesture.current
      gesture.current = null
      setBond(null)
      if (commit && current && !current.outside) {
        commitBond(current.anchorId, current.hoverId)
      }
    }

    const handleUp = () => finish(true)
    const handleCancel = () => finish(false)
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') finish(false)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleCancel)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleCancel)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [bonding, items, onGroupChange])

  const previewRange = (() => {
    if (!bond || bond.outside) return null
    const anchorIndex = items.findIndex((i) => i.id === bond.anchorId)
    const hoverIndex = items.findIndex((i) => i.id === bond.hoverId)
    if (anchorIndex === -1 || hoverIndex === -1) return null
    const range = bondRange(items, anchorIndex, hoverIndex)
    return range.hi > range.lo ? range : null
  })()

  const previewColor = previewRange
    ? items
        .slice(previewRange.lo, previewRange.hi + 1)
        .map((i) => i.groupColor)
        .filter((c): c is string => c !== undefined)
        .map(groupColorCss)[0]
    : undefined

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

  const runs = groupRuns(items)

  const renderRow = (item: PackingItem, position: number, isLast: boolean) => (
    <ItemRow
      key={item.id}
      item={item}
      onUpdate={onUpdateItem}
      onDelete={onDeleteItem}
      dragDisabled={dragDisabled}
      isLast={isLast}
      grouped={item.groupId !== undefined}
      previewUp={
        previewRange !== null &&
        position > previewRange.lo &&
        position <= previewRange.hi
      }
      previewDown={
        previewRange !== null &&
        position >= previewRange.lo &&
        position < previewRange.hi
      }
      previewColor={previewColor}
      groupingDisabled={dragDisabled}
      onBondStart={startBond}
      onUngroup={ungroup}
      onRowRef={registerRow}
      onMoveLeft={prevLuggage ? () => onMoveItem(item, prevLuggage.id) : undefined}
      onMoveRight={nextLuggage ? () => onMoveItem(item, nextLuggage.id) : undefined}
    />
  )

  return (
    <div ref={setRootRef} className="flex w-160 shrink-0 flex-col rounded-lg border bg-card/50">
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
            {runs.map((run) => {
              const rows = run.items.map((item, i) =>
                renderRow(item, run.start + i, i === run.items.length - 1),
              )
              if (run.groupId === undefined || run.items.length < 2) return rows
              const css = groupColorCss(run.groupColor)
              return (
                <div
                  key={run.groupId}
                  className="-mx-2 my-1 rounded-md border px-2"
                  style={{
                    backgroundColor: `color-mix(in oklab, ${css} 10%, transparent)`,
                    borderColor: `color-mix(in oklab, ${css} 35%, transparent)`,
                  }}
                >
                  {rows}
                </div>
              )
            })}
          </SortableContext>
        )}
      </div>
    </div>
  )
}
