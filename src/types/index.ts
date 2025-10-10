// Core data types based on spec

export type Priority = 'P0' | 'P1' | 'P2' | null

export interface Task {
  id: string
  text: string
  priority: Priority
  completed: boolean
  completedAt?: string // ISO 8601 timestamp when task was completed
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
  neutralDark: '#3c3836',    // Dark gray - great contrast with cream text
  neutralMid: '#504945',      // Medium gray - subtle, professional
  neutralWarm: '#665c54',     // Warm gray - lighter neutral option
  softBlue: '#076678',        // Darker blue - distinguishes from P1 (#458588)
  goldenYellow: '#b57614',    // Darker yellow - better text contrast
  deepAqua: '#427b58',        // Darker aqua - improved readability
  warmPurple: '#b16286',      // Purple - works well
  forestGreen: '#79740e',     // Darker muted green
}

export const PRIORITY_COLORS = {
  P0: '#d65d0e', // Orange (high)
  P1: '#458588', // Blue (medium)
  P2: '#928374', // Gray (low)
}
