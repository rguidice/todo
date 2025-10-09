// Core data types based on spec

export type Priority = 'P0' | 'P1' | 'P2' | null

export interface Task {
  id: string
  text: string
  priority: Priority
  completed: boolean
  parentId: string | null
  children: string[]
}

export interface Column {
  id: string
  name: string
  backgroundColor: string
  visible: boolean
  order: number
  autoSort: boolean
  tasks: Task[]
}

export interface AppData {
  columns: Column[]
}

// Gruvbox color palette for columns
export const GRUVBOX_COLORS = {
  warmRed: '#cc241d',
  warmOrange: '#d65d0e',
  warmYellow: '#d79921',
  warmGreen: '#98971a',
  warmAqua: '#689d6a',
  warmBlue: '#458588',
  warmPurple: '#b16286',
}

export const PRIORITY_COLORS = {
  P0: '#d65d0e', // Orange (high)
  P1: '#458588', // Blue (medium)
  P2: '#928374', // Gray (low)
}
