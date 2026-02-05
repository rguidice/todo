import { app, BrowserWindow, ipcMain, screen, dialog } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Settings storage
interface AppSettings {
  dataDirectory: string
  autoClearDuration: '1min' | '5min' | '1hr' | '4hr' | '24hr' | '1week' | 'never'
  dueDateDisplayMode: 'date' | 'days'
}

const SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json')
const DEFAULT_DATA_DIR = path.join(app.getPath('userData'), 'data')

// Mutable data directory (can be changed via settings)
let DATA_DIR = DEFAULT_DATA_DIR

// Load settings from file
async function loadSettings(): Promise<AppSettings> {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8')
    const settings = JSON.parse(data)
    // Ensure all required fields have defaults
    return {
      dataDirectory: settings.dataDirectory || DEFAULT_DATA_DIR,
      autoClearDuration: settings.autoClearDuration || 'never',
      dueDateDisplayMode: settings.dueDateDisplayMode || 'date'
    }
  } catch {
    // Return default settings if file doesn't exist
    return {
      dataDirectory: DEFAULT_DATA_DIR,
      autoClearDuration: 'never',
      dueDateDisplayMode: 'date'
    }
  }
}

// Save settings to file
async function saveSettings(settings: AppSettings): Promise<void> {
  const userDataDir = app.getPath('userData')
  try {
    await fs.access(userDataDir)
  } catch {
    await fs.mkdir(userDataDir, { recursive: true })
  }
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8')
}

let mainWindow: BrowserWindow | null = null

interface WindowState {
  x: number
  y: number
  width: number
  height: number
  isMaximized: boolean
}

const WINDOW_STATE_FILE = path.join(DATA_DIR, 'window-state.json')

// Load saved window state
async function loadWindowState(): Promise<WindowState | null> {
  try {
    const data = await fs.readFile(WINDOW_STATE_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return null
  }
}

// Save window state
async function saveWindowState(state: WindowState): Promise<void> {
  await ensureDataDir()
  await fs.writeFile(WINDOW_STATE_FILE, JSON.stringify(state, null, 2), 'utf-8')
}

// Check if window position is visible on any screen
function isVisibleOnScreen(bounds: { x: number; y: number; width: number; height: number }): boolean {
  const displays = screen.getAllDisplays()
  return displays.some(display => {
    const { x, y, width, height } = display.bounds
    return (
      bounds.x >= x &&
      bounds.y >= y &&
      bounds.x + bounds.width <= x + width &&
      bounds.y + bounds.height <= y + height
    )
  })
}

const createWindow = async () => {
  // Create the browser window with initial size from spec (800x400)
  const preloadPath = path.join(__dirname, 'preload.js')
  console.log('Preload script path:', preloadPath)

  // Load saved window state
  const savedState = await loadWindowState()

  // Default window options
  let windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 800,
    height: 400,
    minWidth: 600,
    minHeight: 300,
    backgroundColor: '#282828', // Gruvbox dark background
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true
    },
    titleBarStyle: 'hidden', // Hide title bar but keep traffic lights
    trafficLightPosition: { x: 10, y: 10 }, // Position stoplight buttons
    show: false // Don't show until ready
  }

  // Restore window position if saved state exists and is visible
  if (savedState) {
    if (isVisibleOnScreen(savedState)) {
      windowOptions.x = savedState.x
      windowOptions.y = savedState.y
      windowOptions.width = savedState.width
      windowOptions.height = savedState.height
    }
  }

  mainWindow = new BrowserWindow(windowOptions)

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools() // Open DevTools in development
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    // Restore maximized state if it was saved
    if (savedState?.isMaximized) {
      mainWindow?.maximize()
    }
    mainWindow?.show()
  })

  // Save window state on close (for persistence between sessions)
  mainWindow.on('close', async () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds()
      const isMaximized = mainWindow.isMaximized()

      const state: WindowState = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMaximized
      }

      await saveWindowState(state)
      console.log('Window state saved:', state)
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

// IPC handlers for file operations
ipcMain.handle('save-file', async (_event, filename: string, data: string) => {
  await ensureDataDir()
  const filePath = path.join(DATA_DIR, filename)
  await fs.writeFile(filePath, data, 'utf-8')
})

ipcMain.handle('load-file', async (_event, filename: string) => {
  await ensureDataDir()
  const filePath = path.join(DATA_DIR, filename)
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return data
  } catch (error) {
    // File doesn't exist, return null
    return null
  }
})

ipcMain.handle('save-report', async (_event, filename: string, data: string) => {
  await ensureDataDir()
  const reportsDir = path.join(DATA_DIR, 'reports')

  // Ensure reports directory exists
  try {
    await fs.access(reportsDir)
  } catch {
    await fs.mkdir(reportsDir, { recursive: true })
  }

  const filePath = path.join(reportsDir, filename)
  await fs.writeFile(filePath, data, 'utf-8')
})

ipcMain.handle('check-report-exists', async (_event, filename: string) => {
  await ensureDataDir()
  const reportsDir = path.join(DATA_DIR, 'reports')
  const filePath = path.join(reportsDir, filename)

  try {
    await fs.access(filePath)
    return true // File exists
  } catch {
    return false // File doesn't exist
  }
})

// Settings IPC handlers
ipcMain.handle('get-settings', async () => {
  return await loadSettings()
})

ipcMain.handle('update-settings', async (_event, settings: AppSettings) => {
  await saveSettings(settings)
  DATA_DIR = settings.dataDirectory
  console.log('Data directory updated to:', DATA_DIR)
})

ipcMain.handle('select-directory', async () => {
  if (!mainWindow) return null

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Data Directory',
    buttonLabel: 'Select'
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
})

ipcMain.handle('get-data-directory', async () => {
  return DATA_DIR
})

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  // Load settings and set DATA_DIR before creating window
  const settings = await loadSettings()
  DATA_DIR = settings.dataDirectory
  console.log('Data directory:', DATA_DIR)

  createWindow()

  app.on('activate', () => {
    // On macOS re-create window when dock icon is clicked and no windows open
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
