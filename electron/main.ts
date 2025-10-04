import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Data directory for storing tasks (in project root)
const DATA_DIR = path.join(__dirname, '../../data')
console.log('Data directory:', DATA_DIR)

let mainWindow: BrowserWindow | null = null

const createWindow = () => {
  // Create the browser window with initial size from spec (800x400)
  const preloadPath = path.join(__dirname, 'preload.js')
  console.log('Preload script path:', preloadPath)

  mainWindow = new BrowserWindow({
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
  })

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools() // Open DevTools in development
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Save window bounds on close (for persistence between sessions)
  mainWindow.on('close', () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds()
      // TODO: Save bounds to storage for next session
      console.log('Window bounds:', bounds)
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

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
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
