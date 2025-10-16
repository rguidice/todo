import { contextBridge, ipcRenderer } from 'electron'

console.log('[Preload] Script is running!')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // File operations for saving/loading tasks
  saveFile: (filename: string, data: string) =>
    ipcRenderer.invoke('save-file', filename, data),

  loadFile: (filename: string) =>
    ipcRenderer.invoke('load-file', filename),

  // Report operations
  saveReport: (filename: string, data: string) =>
    ipcRenderer.invoke('save-report', filename, data),

  checkReportExists: (filename: string) =>
    ipcRenderer.invoke('check-report-exists', filename),

  // Settings operations
  getSettings: () =>
    ipcRenderer.invoke('get-settings'),

  updateSettings: (settings: AppSettings) =>
    ipcRenderer.invoke('update-settings', settings),

  selectDirectory: () =>
    ipcRenderer.invoke('select-directory'),

  getDataDirectory: () =>
    ipcRenderer.invoke('get-data-directory'),

  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
})

// TypeScript type definition for the exposed API
export interface AppSettings {
  dataDirectory: string
  autoClearDuration: '1min' | '5min' | '1hr' | '4hr' | '24hr' | '1week' | 'never'
}

export interface ElectronAPI {
  saveFile: (filename: string, data: string) => Promise<void>
  loadFile: (filename: string) => Promise<string>
  saveReport: (filename: string, data: string) => Promise<void>
  checkReportExists: (filename: string) => Promise<boolean>
  getSettings: () => Promise<AppSettings>
  updateSettings: (settings: AppSettings) => Promise<void>
  selectDirectory: () => Promise<string | null>
  getDataDirectory: () => Promise<string>
  minimize: () => void
  maximize: () => void
  close: () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}
