import { AppData } from '../types'

// Storage utilities for tasks.json and tasks.md
// These will use Electron's file system APIs via the preload bridge

export const loadTasks = async (): Promise<AppData> => {
  try {
    if (!window.electron) {
      console.error('window.electron is not available!')
      return { columns: [] }
    }
    const data = await window.electron.loadFile('tasks.json')
    if (data) {
      console.log('Loaded tasks from file:', data)
      const parsed = JSON.parse(data) as AppData
      // Add missing fields for backward compatibility
      parsed.columns = parsed.columns.map((col, index) => ({
        ...col,
        visible: col.visible ?? true,
        order: col.order ?? index,
        autoSort: col.autoSort ?? false,
        tasks: (col.tasks ?? []).map(task => ({
          ...task,
          cleared: task.cleared ?? false,
          pending: task.pending ?? false,
          children: task.children ?? [],
        }))
      }))
      return parsed
    }
    console.log('No tasks file found, starting with empty state')
    return { columns: [] }
  } catch (error) {
    console.error('Failed to load tasks:', error)
    // Return default empty structure
    return { columns: [] }
  }
}

export const saveTasks = async (data: AppData): Promise<void> => {
  try {
    const jsonData = JSON.stringify(data, null, 2)
    console.log('Saving tasks to file:', jsonData)
    await window.electron.saveFile('tasks.json', jsonData)

    // Also generate and save markdown version
    const markdown = generateMarkdown(data)
    await window.electron.saveFile('tasks.md', markdown)
    console.log('Tasks saved successfully')
  } catch (error) {
    console.error('Failed to save tasks:', error)
    throw error
  }
}

export const generateMarkdown = (data: AppData): string => {
  let markdown = ''

  for (const column of data.columns) {
    if (!column.visible) continue

    markdown += `# ${column.name}\n\n`

    // Build task hierarchy
    const rootTasks = column.tasks.filter(t => !t.parentId)

    const renderTask = (task: any, level = 0): string => {
      const checkbox = task.completed ? '✅' : '⬜'
      const priority = task.priority ? ` [${task.priority}]` : ''

      let md = ''
      if (level === 0) {
        // Top-level task uses ##
        md = `## ${task.text}${priority} ${checkbox}\n`
      } else {
        // Children use - with proper indentation
        const indent = '  '.repeat(level - 1)
        md = `${indent}- ${task.text}${priority} ${checkbox}\n`
      }

      // Render children recursively
      const children = column.tasks.filter(t => t.parentId === task.id)
      for (const child of children) {
        md += renderTask(child, level + 1)
      }

      return md
    }

    for (const task of rootTasks) {
      markdown += renderTask(task)
      markdown += '\n' // Empty line between top-level tasks
    }
  }

  return markdown.trim() + '\n'
}
