import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { PackingItem } from '@/types/item'
import type { Luggage } from '@/types/luggage'
import type { ImportedItem } from '@/features/packing/hooks/usePackingItems'

const REQUIRED_STRUCTURE = `[
  {
    "title": "Item name",
    "count": 2,
    "weight": 1.2,
    "luggage": "Main"
  }
]`

interface ImportExportBarProps {
  items: PackingItem[]
  luggages: Luggage[]
  onImport: (entries: ImportedItem[]) => Promise<void>
}

function parseImport(raw: string): ImportedItem[] {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    throw new Error('Invalid JSON')
  }
  if (!Array.isArray(data)) throw new Error('JSON must be an array of items')

  return data.map((entry, i) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error(`Item ${i + 1} is not an object`)
    }
    const { title, count, weight, luggage } = entry as Record<string, unknown>
    if (typeof title !== 'string' || !title.trim()) {
      throw new Error(`Item ${i + 1} is missing a "title" string`)
    }
    if (count !== undefined && typeof count !== 'number') {
      throw new Error(`Item ${i + 1} has a non-numeric "count"`)
    }
    if (weight !== undefined && typeof weight !== 'number') {
      throw new Error(`Item ${i + 1} has a non-numeric "weight"`)
    }
    if (luggage !== undefined && typeof luggage !== 'string') {
      throw new Error(`Item ${i + 1} has a non-string "luggage"`)
    }
    return { title: title.trim(), count, weight, luggage }
  })
}

function exportItems(items: PackingItem[], luggages: Luggage[]) {
  const luggageNames = new Map(luggages.map((l) => [l.id, l.name]))
  const data: ImportedItem[] = items.map((item) => ({
    title: item.title,
    count: item.count,
    weight: item.weight,
    luggage: luggageNames.get(item.luggageId),
  }))
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'packing-list.json'
  a.click()
  URL.revokeObjectURL(url)
}

export function ImportExportBar({ items, luggages, onImport }: ImportExportBarProps) {
  const [open, setOpen] = useState(false)
  const [raw, setRaw] = useState('')
  const [importing, setImporting] = useState(false)

  const handleCopy = () => {
    void navigator.clipboard.writeText(REQUIRED_STRUCTURE)
    toast.success('Structure copied')
  }

  const handleFile = (file: File) => {
    file.text().then(setRaw).catch(() => toast.error('Failed to read file'))
  }

  const handleImport = async () => {
    let entries: ImportedItem[]
    try {
      entries = parseImport(raw)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid JSON')
      return
    }
    if (entries.length === 0) {
      toast.error('No items to import')
      return
    }
    setImporting(true)
    try {
      await onImport(entries)
      toast.success(`Imported ${entries.length} item(s)`)
      setRaw('')
      setOpen(false)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Upload className="size-4" />
            Import
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import items</DialogTitle>
            <DialogDescription>
              Adds items to your current list. Paste JSON below or choose a
              file. "luggage" is optional — unrecognized or omitted names fall
              back to the currently selected luggage.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Required structure
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                >
                  <Copy className="size-3" />
                  Copy
                </Button>
              </div>
              <pre className="overflow-x-auto rounded-md border bg-muted p-2 text-xs">
                {REQUIRED_STRUCTURE}
              </pre>
            </div>

            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="Paste JSON here"
              rows={6}
              className="w-full rounded-md border border-input bg-background p-2 text-sm outline-none focus-visible:border-ring"
            />

            <input
              type="file"
              accept="application/json"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
              className="text-sm text-muted-foreground"
            />

            <Button
              type="button"
              onClick={() => void handleImport()}
              disabled={importing || !raw.trim()}
            >
              {importing ? 'Importing…' : 'Import items'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => exportItems(items, luggages)}
        disabled={items.length === 0}
      >
        <Download className="size-4" />
        Export
      </Button>
    </div>
  )
}
