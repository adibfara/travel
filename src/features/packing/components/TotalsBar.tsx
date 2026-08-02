import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { downloadReceipt } from '@/lib/receipt'
import { formatWeight } from '@/lib/itemStorage'
import { AddItemRow } from '@/features/packing/components/AddItemRow'
import type { PackingItem } from '@/types/item'

interface TotalsBarProps {
  items: PackingItem[]
  count: number
  weight: number
  hiddenWeight: number
  onAdd: (title: string, weight?: number, count?: number) => void
}

export function TotalsBar({ items, count, weight, hiddenWeight, onAdd }: TotalsBarProps) {
  return (
    <div className="sticky bottom-0 border-t bg-background/95 px-4 pt-3 pb-2 backdrop-blur">
      <div className="flex items-center justify-between pb-2">
        <span className="text-sm text-muted-foreground">
          {count} item{count === 1 ? '' : 's'}
        </span>
        <div className="flex items-center gap-4 text-sm font-medium">
          <span>
            {formatWeight(weight)}
            {hiddenWeight > 0 && (
              <span className="text-muted-foreground"> ({formatWeight(hiddenWeight)})</span>
            )}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Print"
            onClick={() => downloadReceipt(items)}
            disabled={items.length === 0}
          >
            <Printer className="size-4" />
          </Button>
        </div>
      </div>

      <AddItemRow onAdd={onAdd} />
    </div>
  )
}
