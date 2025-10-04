const { contextBridge, ipcRenderer } = require('electron')

console.log('[Preload] Script is running!')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // File operations for saving/loading tasks
  saveFile: (filename, data) =>
    ipcRenderer.invoke('save-file', filename, data),

  loadFile: (filename) =>
    ipcRenderer.invoke('load-file', filename),

  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
})

console.log('[Preload] window.electron exposed successfully!')
