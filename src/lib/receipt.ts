import type { PackingItem } from '@/types/item'
import { totalCount, totalWeight } from '@/lib/itemStorage'

const WIDTH = 480
const PADDING = 24
const ROW_HEIGHT = 28
const FONT = '14px "Courier New", monospace'
const BOLD_FONT = 'bold 14px "Courier New", monospace'

function fmt(n: number | undefined): string {
  return n === undefined ? '-' : n.toFixed(1)
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let out = text
  while (out.length > 1 && ctx.measureText(out + '…').width > maxWidth) {
    out = out.slice(0, -1)
  }
  return out + '…'
}

function dashedLine(ctx: CanvasRenderingContext2D, y: number) {
  ctx.save()
  ctx.strokeStyle = '#00000055'
  ctx.setLineDash([4, 3])
  ctx.beginPath()
  ctx.moveTo(PADDING, y)
  ctx.lineTo(WIDTH - PADDING, y)
  ctx.stroke()
  ctx.restore()
}

export function renderReceipt(items: PackingItem[]): HTMLCanvasElement {
  const nameColX = PADDING
  const nameColWidth = 320
  const qtyColX = PADDING + nameColWidth
  const weightColX = qtyColX + 40

  const headerHeight = 90
  const rowsHeight = items.length * ROW_HEIGHT
  const totalsHeight = 86
  const bottomPadding = 40
  const height = headerHeight + rowsHeight + totalsHeight + bottomPadding

  const canvas = document.createElement('canvas')
  const scale = 2
  canvas.width = WIDTH * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.scale(scale, scale)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, WIDTH, height)
  ctx.fillStyle = '#000000'
  ctx.textBaseline = 'alphabetic'

  let y = 36
  ctx.font = 'bold 20px "Courier New", monospace'
  ctx.textAlign = 'center'
  ctx.fillText('PACKING LIST', WIDTH / 2, y)

  y += 22
  ctx.font = FONT
  ctx.fillText(new Date().toLocaleDateString(), WIDTH / 2, y)

  y += 18
  dashedLine(ctx, y)

  y += 22
  ctx.textAlign = 'left'
  ctx.font = BOLD_FONT
  ctx.fillText('ITEM', nameColX, y)
  ctx.textAlign = 'right'
  ctx.fillText('QTY', qtyColX + 30, y)
  ctx.fillText('KG', weightColX + 45, y)

  y += 12
  dashedLine(ctx, y)

  ctx.font = FONT
  for (const item of items) {
    y += ROW_HEIGHT
    ctx.textAlign = 'left'
    ctx.fillText(truncate(ctx, item.title, nameColWidth - 10), nameColX, y)
    ctx.textAlign = 'right'
    ctx.fillText(`x${item.count}`, qtyColX + 30, y)
    ctx.fillText(
      fmt(item.weight !== undefined ? item.weight * item.count : undefined),
      weightColX + 45,
      y,
    )
  }

  y += 16
  dashedLine(ctx, y)

  y += 26
  ctx.font = BOLD_FONT
  ctx.textAlign = 'left'
  ctx.fillText('TOTAL ITEMS', nameColX, y)
  ctx.textAlign = 'right'
  ctx.fillText(String(totalCount(items)), WIDTH - PADDING, y)

  y += 24
  ctx.textAlign = 'left'
  ctx.fillText('TOTAL WEIGHT', nameColX, y)
  ctx.textAlign = 'right'
  ctx.fillText(`${totalWeight(items).toFixed(1)} kg`, WIDTH - PADDING, y)

  return canvas
}

export function downloadReceipt(items: PackingItem[]) {
  const canvas = renderReceipt(items)
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'packing-list-receipt.png'
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}
