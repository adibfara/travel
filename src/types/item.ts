export interface PackingItem {
  id: string
  title: string
  count: number
  weight?: number
  luggageId: string
  order: number
  lastModified: number
  groupId?: string
  groupColor?: string
}
