export interface PackingItem {
  id: string
  title: string
  count: number
  weight?: number
  hidden?: boolean
  order: number
  lastModified: number
}
