import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from 'react'
import { groupColorCss } from '@/lib/groups'
import { cn } from '@/lib/utils'

interface GroupHandleProps {
  itemId: string
  /** Colour key of the group this item belongs to, if any. */
  groupColor?: string
  grouped?: boolean
  /** Dashed connector halves drawn while a bond gesture previews this row. */
  previewUp?: boolean
  previewDown?: boolean
  previewColor?: string
  disabled?: boolean
  onBondStart: (itemId: string) => void
  onUngroup: (itemId: string) => void
}

export function GroupHandle({
  itemId,
  groupColor,
  grouped,
  previewUp,
  previewDown,
  previewColor,
  disabled,
  onBondStart,
  onUngroup,
}: GroupHandleProps) {
  const handlePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (disabled) return
    // The row itself carries the dnd-kit listeners — keep them out of this gesture.
    e.stopPropagation()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    onBondStart(itemId)
  }

  const handleDoubleClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (!disabled && grouped) onUngroup(itemId)
  }

  const lineColor = previewColor ?? 'var(--color-foreground)'

  return (
    <div className="relative flex w-4 shrink-0 items-center justify-center self-stretch">
      {previewUp && (
        <span
          className="pointer-events-none absolute left-1/2 top-0 h-1/2 -translate-x-1/2 animate-pulse border-l-2 border-dashed"
          style={{ borderColor: lineColor }}
        />
      )}
      {previewDown && (
        <span
          className="pointer-events-none absolute bottom-0 left-1/2 h-1/2 -translate-x-1/2 animate-pulse border-l-2 border-dashed"
          style={{ borderColor: lineColor }}
        />
      )}
      <button
        type="button"
        disabled={disabled}
        aria-label={grouped ? 'Grouped — drag to extend, double-click to ungroup' : 'Drag to group with neighbouring items'}
        title={grouped ? 'Drag to extend group · double-click to ungroup' : 'Drag up or down to group'}
        onPointerDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
        onClick={(e) => e.stopPropagation()}
        className="group/handle relative flex size-4 touch-none items-center justify-center rounded-full disabled:cursor-default"
      >
        <span
          className={cn(
            'size-2 rounded-full transition-transform duration-150',
            !disabled && 'group-hover/handle:scale-[1.7] group-active/handle:scale-[1.7]',
            !grouped && 'bg-muted-foreground/40',
            (previewUp || previewDown) && 'scale-[1.7]',
          )}
          style={grouped ? { backgroundColor: groupColorCss(groupColor) } : undefined}
        />
      </button>
    </div>
  )
}
