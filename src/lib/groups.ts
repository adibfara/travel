import type { PackingItem } from '@/types/item'

/**
 * Pure group helpers. A group is a contiguous run of items sharing a `groupId`
 * inside a single luggage column; groups of fewer than two members are dissolved.
 */

export const GROUP_COLORS = {
  emerald: { css: 'oklch(0.72 0.15 162)', hex: '#10b981' },
  sky: { css: 'oklch(0.72 0.14 236)', hex: '#0ea5e9' },
  violet: { css: 'oklch(0.65 0.2 293)', hex: '#8b5cf6' },
  amber: { css: 'oklch(0.78 0.16 76)', hex: '#f59e0b' },
  rose: { css: 'oklch(0.68 0.19 12)', hex: '#f43f5e' },
  teal: { css: 'oklch(0.72 0.12 185)', hex: '#14b8a6' },
  indigo: { css: 'oklch(0.6 0.18 275)', hex: '#6366f1' },
  orange: { css: 'oklch(0.73 0.17 50)', hex: '#f97316' },
} as const

export type GroupColorKey = keyof typeof GROUP_COLORS

const COLOR_KEYS = Object.keys(GROUP_COLORS) as GroupColorKey[]

export function isGroupColor(key: string | undefined): key is GroupColorKey {
  return key !== undefined && key in GROUP_COLORS
}

export function groupColorCss(key: string | undefined): string {
  return isGroupColor(key) ? GROUP_COLORS[key].css : GROUP_COLORS.emerald.css
}

export function groupColorHex(key: string | undefined): string {
  return isGroupColor(key) ? GROUP_COLORS[key].hex : GROUP_COLORS.emerald.hex
}

/** Picks a hue that is not already taken in the column, falling back to any hue. */
export function randomGroupColor(used: (string | undefined)[]): GroupColorKey {
  const taken = new Set(used.filter(isGroupColor))
  const free = COLOR_KEYS.filter((key) => !taken.has(key))
  const pool = free.length > 0 ? free : COLOR_KEYS
  return pool[Math.floor(Math.random() * pool.length)]
}

export interface GroupRun {
  groupId?: string
  groupColor?: string
  items: PackingItem[]
  start: number
}

/** Splits an ordered column into consecutive runs sharing a `groupId`. */
export function groupRuns(items: PackingItem[]): GroupRun[] {
  const runs: GroupRun[] = []
  items.forEach((item, index) => {
    const last = runs[runs.length - 1]
    if (last && item.groupId !== undefined && last.groupId === item.groupId) {
      last.items.push(item)
    } else {
      runs.push({
        groupId: item.groupId,
        groupColor: item.groupColor,
        items: [item],
        start: index,
      })
    }
  })
  return runs
}

/**
 * Index range covered by a bond gesture from `anchorIndex` to `hoverIndex`,
 * grown until it fully contains every group it touches.
 */
export function bondRange(
  items: PackingItem[],
  anchorIndex: number,
  hoverIndex: number,
): { lo: number; hi: number } {
  let lo = Math.min(anchorIndex, hoverIndex)
  let hi = Math.max(anchorIndex, hoverIndex)
  const runs = groupRuns(items).filter((run) => run.groupId !== undefined)
  let changed = true
  while (changed) {
    changed = false
    for (const run of runs) {
      const runLo = run.start
      const runHi = run.start + run.items.length - 1
      if (runLo > hi || runHi < lo) continue
      if (runLo < lo) {
        lo = runLo
        changed = true
      }
      if (runHi > hi) {
        hi = runHi
        changed = true
      }
    }
  }
  return { lo, hi }
}

/**
 * Enforces the group invariants on one ordered column: a `groupId` may only
 * cover a single run of at least two items. Everything else is stripped.
 */
export function repairGroups(items: PackingItem[]): PackingItem[] {
  const seen = new Set<string>()
  const runs = groupRuns(items)
  const cleared = new Set<string>()
  for (const run of runs) {
    if (run.groupId === undefined) continue
    if (run.items.length < 2 || seen.has(run.groupId)) {
      for (const item of run.items) cleared.add(item.id)
      continue
    }
    seen.add(run.groupId)
  }
  if (cleared.size === 0) return items
  return items.map((item) =>
    cleared.has(item.id)
      ? { ...item, groupId: undefined, groupColor: undefined }
      : item,
  )
}
