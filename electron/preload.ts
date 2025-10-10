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

  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
})

// TypeScript type definition for the exposed API
export interface ElectronAPI {
  saveFile: (filename: string, data: string) => Promise<void>
  loadFile: (filename: string) => Promise<string>
  saveReport: (filename: string, data: string) => Promise<void>
  checkReportExists: (filename: string) => Promise<boolean>
  minimize: () => void
  maximize: () => void
  close: () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}
