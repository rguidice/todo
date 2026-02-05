// Core data types based on spec

export type Priority = 'P0' | 'P1' | 'P2' | null

export interface Task {
  id: string
  text: string
  priority: Priority
  completed: boolean
  completedAt?: string // ISO 8601 timestamp when task was completed
  cleared: boolean // Whether task has been cleared from view (but kept for reports)
  pending: boolean
  clearedAt?: string // ISO 8601 timestamp when task was cleared
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

// Auto-clear duration options
export type AutoClearDuration = '1min' | '5min' | '1hr' | '4hr' | '24hr' | 'overnight' | '1week' | 'never'

export interface AppSettings {
  dataDirectory: string
  autoClearDuration: AutoClearDuration
}

export const AUTO_CLEAR_OPTIONS = {
  '1min': { label: '1 minute', milliseconds: 60 * 1000 },
  '5min': { label: '5 minutes', milliseconds: 5 * 60 * 1000 },
  '1hr': { label: '1 hour', milliseconds: 60 * 60 * 1000 },
  '4hr': { label: '4 hours', milliseconds: 4 * 60 * 60 * 1000 },
  '24hr': { label: '24 hours', milliseconds: 24 * 60 * 60 * 1000 },
  'overnight': { label: 'Overnight (3 AM)', milliseconds: 0 },
  '1week': { label: '1 week', milliseconds: 7 * 24 * 60 * 60 * 1000 },
  'never': { label: 'Never', milliseconds: Infinity }
} as const

// Maximum retention period for cleared tasks (for report generation)
// Tasks cleared longer than this will be permanently deleted
export const MAX_RETENTION_DAYS = 90
export const MAX_RETENTION_MS = MAX_RETENTION_DAYS * 24 * 60 * 60 * 1000
