import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { AppData, Column, Task, Priority, AppSettings, AUTO_CLEAR_OPTIONS, MAX_RETENTION_MS } from '../types'
import { loadTasks, saveTasks } from '../utils/storage'

interface AppContextType {
  data: AppData
  addColumn: (name: string, backgroundColor: string) => void
  deleteColumn: (columnId: string) => void
  updateColumnColor: (columnId: string, backgroundColor: string) => void
  reorderColumns: (fromIndex: number, toIndex: number) => void
  addTask: (columnId: string, text: string, priority?: Priority) => void
  addSubtask: (columnId: string, parentId: string, text: string, priority?: Priority) => void
  toggleTask: (columnId: string, taskId: string) => void
  deleteTask: (columnId: string, taskId: string) => void
  updateTask: (columnId: string, taskId: string, text: string) => void
  updateTaskPriority: (columnId: string, taskId: string, priority: Priority) => void
  toggleAutoSort: (columnId: string) => void
  toggleColumnVisibility: (columnId: string) => void
  clearCompleted: (columnId: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>({ columns: [] })
  const isFirstRender = useRef(true)

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      const loadedData = await loadTasks()
      setData(loadedData)
      isFirstRender.current = false
    }
    loadData()
  }, [])

  // Auto-save whenever data changes (skip first render)
  useEffect(() => {
    if (!isFirstRender.current) {
      saveTasks(data)
    }
  }, [data])

  // Auto-clear completed tasks based on settings and permanently delete old cleared tasks
  useEffect(() => {
    const checkAndClearCompletedTasks = async () => {
      try {
        const settings: AppSettings = await window.electron.getSettings()
        const duration = settings.autoClearDuration
        const now = new Date().toISOString()
        const currentTime = Date.now()

        setData(prev => ({
          ...prev,
          columns: prev.columns.map(col => {
            // Step 1: Mark completed tasks as cleared if they're past the auto-clear duration
            let updatedTasks = col.tasks.map(task => {
              // Skip if auto-clear is disabled or task is already cleared
              if (duration === 'never' || task.cleared) return task

              // Check if task should be auto-cleared
              if (task.completed && task.completedAt) {
                const completedTime = new Date(task.completedAt).getTime()

                let cutoffTime: number
                if (duration === 'overnight') {
                  // Overnight: clear tasks completed before the most recent 3 AM
                  const today3AM = new Date()
                  today3AM.setHours(3, 0, 0, 0)
                  cutoffTime = today3AM.getTime()
                  if (currentTime < cutoffTime) {
                    // Before 3 AM today, use yesterday's 3 AM
                    cutoffTime -= 24 * 60 * 60 * 1000
                  }
                } else {
                  cutoffTime = currentTime - AUTO_CLEAR_OPTIONS[duration].milliseconds
                }

                if (completedTime < cutoffTime) {
                  return { ...task, cleared: true, clearedAt: now }
                }
              }

              return task
            })

            // Step 2: Permanently delete tasks that have been cleared longer than retention period
            const retentionCutoffTime = currentTime - MAX_RETENTION_MS
            const tasksToDelete = new Set<string>()

            const checkForDeletion = (task: Task) => {
              if (task.cleared && task.clearedAt) {
                const clearedTime = new Date(task.clearedAt).getTime()
                if (clearedTime < retentionCutoffTime) {
                  tasksToDelete.add(task.id)
                  // Add all descendants for deletion
                  task.children.forEach(childId => {
                    const child = updatedTasks.find(t => t.id === childId)
                    if (child) {
                      tasksToDelete.add(childId)
                      // Recursively add descendants
                      const addDescendants = (t: Task) => {
                        t.children.forEach(cId => {
                          tasksToDelete.add(cId)
                          const c = updatedTasks.find(task => task.id === cId)
                          if (c) addDescendants(c)
                        })
                      }
                      addDescendants(child)
                    }
                  })
                }
              }
            }

            updatedTasks.forEach(task => checkForDeletion(task))

            // Remove permanently deleted tasks
            if (tasksToDelete.size > 0) {
              updatedTasks = updatedTasks
                .filter(task => !tasksToDelete.has(task.id))
                .map(task => ({
                  ...task,
                  children: task.children.filter(id => !tasksToDelete.has(id))
                }))
            }

            return {
              ...col,
              tasks: updatedTasks
            }
          })
        }))
      } catch (error) {
        console.error('Failed to auto-clear completed tasks:', error)
      }
    }

    // Check immediately on mount
    checkAndClearCompletedTasks()

    // Then check every minute
    const interval = setInterval(checkAndClearCompletedTasks, 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  const addColumn = (name: string, backgroundColor: string) => {
    const newColumn: Column = {
      id: `col-${Date.now()}`,
      name,
      backgroundColor,
      visible: true,
      order: data.columns.length,
      autoSort: false,
      tasks: []
    }
    setData(prev => ({
      ...prev,
      columns: [...prev.columns, newColumn]
    }))
  }

  const addTask = (columnId: string, text: string, priority: Priority = null) => {
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id === columnId) {
          const newTask: Task = {
            id: `task-${Date.now()}`,
            text,
            priority,
            completed: false,
            cleared: false,
            parentId: null,
            children: []
          }
          return {
            ...col,
            tasks: [...col.tasks, newTask]
          }
        }
        return col
      })
    }))
  }

  const addSubtask = (columnId: string, parentId: string, text: string, priority: Priority = null) => {
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id === columnId) {
          const newSubtask: Task = {
            id: `task-${Date.now()}`,
            text,
            priority, // Allow setting priority for subtasks
            completed: false,
            cleared: false,
            parentId,
            children: []
          }
          return {
            ...col,
            tasks: col.tasks.map(task =>
              task.id === parentId
                ? { ...task, children: [...task.children, newSubtask.id] }
                : task
            ).concat(newSubtask)
          }
        }
        return col
      })
    }))
  }

  const toggleTask = (columnId: string, taskId: string) => {
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id === columnId) {
          // Find the task being toggled
          const targetTask = col.tasks.find(t => t.id === taskId)
          if (!targetTask) return col

          const newCompletedState = !targetTask.completed
          const completionTimestamp = newCompletedState ? new Date().toISOString() : undefined

          // Helper function to get all descendant task IDs recursively
          const getDescendantIds = (task: Task): string[] => {
            const childIds = task.children.flatMap(childId => {
              const child = col.tasks.find(t => t.id === childId)
              return child ? [childId, ...getDescendantIds(child)] : []
            })
            return childIds
          }

          const descendantIds = getDescendantIds(targetTask)
          const affectedIds = new Set([taskId, ...descendantIds])

          return {
            ...col,
            tasks: col.tasks.map(task =>
              affectedIds.has(task.id)
                ? { ...task, completed: newCompletedState, completedAt: completionTimestamp }
                : task
            )
          }
        }
        return col
      })
    }))
  }

  const deleteTask = (columnId: string, taskId: string) => {
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id === columnId) {
          // Find the task being deleted
          const targetTask = col.tasks.find(t => t.id === taskId)
          if (!targetTask) return col

          // Helper function to get all descendant task IDs recursively
          const getDescendantIds = (task: Task): string[] => {
            const childIds = task.children.flatMap(childId => {
              const child = col.tasks.find(t => t.id === childId)
              return child ? [childId, ...getDescendantIds(child)] : []
            })
            return childIds
          }

          const descendantIds = getDescendantIds(targetTask)
          const idsToDelete = new Set([taskId, ...descendantIds])

          // Also remove this task from its parent's children array
          const updatedTasks = col.tasks
            .filter(task => !idsToDelete.has(task.id))
            .map(task =>
              task.children.includes(taskId)
                ? { ...task, children: task.children.filter(id => id !== taskId) }
                : task
            )

          return {
            ...col,
            tasks: updatedTasks
          }
        }
        return col
      })
    }))
  }

  const clearCompleted = (columnId: string) => {
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id === columnId) {
          const now = new Date().toISOString()

          // Get all completed task IDs (including their descendants)
          const completedTaskIds = new Set<string>()

          const addCompletedAndDescendants = (task: Task) => {
            if (task.completed) {
              completedTaskIds.add(task.id)
              // Add all descendants
              task.children.forEach(childId => {
                const child = col.tasks.find(t => t.id === childId)
                if (child) addCompletedAndDescendants(child)
              })
            }
          }

          col.tasks.forEach(task => addCompletedAndDescendants(task))

          // Mark completed tasks as cleared (don't delete them yet)
          const updatedTasks = col.tasks.map(task => {
            if (completedTaskIds.has(task.id)) {
              return { ...task, cleared: true, clearedAt: now }
            }
            return task
          })

          return {
            ...col,
            tasks: updatedTasks
          }
        }
        return col
      })
    }))
  }

  const updateTask = (columnId: string, taskId: string, text: string) => {
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id === columnId) {
          return {
            ...col,
            tasks: col.tasks.map(task =>
              task.id === taskId
                ? { ...task, text }
                : task
            )
          }
        }
        return col
      })
    }))
  }

  const updateTaskPriority = (columnId: string, taskId: string, priority: Priority) => {
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id === columnId) {
          return {
            ...col,
            tasks: col.tasks.map(task =>
              task.id === taskId
                ? { ...task, priority }
                : task
            )
          }
        }
        return col
      })
    }))
  }

  const toggleAutoSort = (columnId: string) => {
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(col =>
        col.id === columnId
          ? { ...col, autoSort: !col.autoSort }
          : col
      )
    }))
  }

  const deleteColumn = (columnId: string) => {
    setData(prev => ({
      ...prev,
      columns: prev.columns.filter(col => col.id !== columnId)
    }))
  }

  const updateColumnColor = (columnId: string, backgroundColor: string) => {
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(col =>
        col.id === columnId
          ? { ...col, backgroundColor }
          : col
      )
    }))
  }

  const toggleColumnVisibility = (columnId: string) => {
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(col =>
        col.id === columnId
          ? { ...col, visible: !col.visible }
          : col
      )
    }))
  }

  const reorderColumns = (fromIndex: number, toIndex: number) => {
    setData(prev => {
      const newColumns = [...prev.columns]
      const [movedColumn] = newColumns.splice(fromIndex, 1)
      newColumns.splice(toIndex, 0, movedColumn)

      // Update order field for all columns
      return {
        ...prev,
        columns: newColumns.map((col, index) => ({
          ...col,
          order: index
        }))
      }
    })
  }

  return (
    <AppContext.Provider value={{ data, addColumn, deleteColumn, updateColumnColor, reorderColumns, addTask, addSubtask, toggleTask, deleteTask, updateTask, updateTaskPriority, toggleAutoSort, toggleColumnVisibility, clearCompleted }}>
      {children}
    </AppContext.Provider>
  )
}
