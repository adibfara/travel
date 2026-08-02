import { ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SortKey = 'default' | 'weight'
export type SortDir = 'asc' | 'desc'

interface ListHeaderProps {
  sortKey: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
}

function SortButton({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-end gap-0.5 text-xs font-medium text-muted-foreground hover:text-foreground',
        active && 'text-foreground',
        className,
      )}
    >
      {label}
      {active &&
        (dir === 'asc' ? (
          <ArrowUp className="size-3" />
        ) : (
          <ArrowDown className="size-3" />
        ))}
    </button>
  )
}

export function ListHeader({ sortKey, sortDir, onSort }: ListHeaderProps) {
  return (
    <div className="flex items-center gap-1 px-1 pb-1">
      <span className="w-4" />
      <span className="flex-1 text-xs font-medium text-muted-foreground">
        Name
      </span>
      <span className="w-[72px] text-center text-xs font-medium text-muted-foreground">
        Count
      </span>
      <SortButton
        label="Weight"
        active={sortKey === 'weight'}
        dir={sortDir}
        onClick={() => onSort('weight')}
        className="w-[72px] justify-center"
      />
    </div>
  )
}
