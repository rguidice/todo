import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { AppData, Column, Task, Priority, AppSettings, AUTO_CLEAR_OPTIONS, MAX_RETENTION_MS, TodayData } from '../types'
import { loadTasks, saveTasks, loadTodayData, saveTodayData, getTodayDateString } from '../utils/storage'

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
  togglePending: (columnId: string, taskId: string) => void
  setDueDate: (columnId: string, taskId: string, dueDate: string) => void
  removeDueDate: (columnId: string, taskId: string) => void
  toggleAutoSort: (columnId: string) => void
  toggleColumnVisibility: (columnId: string) => void
  clearCompleted: (columnId: string) => void
  todayData: TodayData
  addToToday: (columnId: string, taskId: string) => void
  removeFromToday: (columnId: string, taskId: string) => void
  restoreYesterday: () => void
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
  const [todayData, setTodayData] = useState<TodayData>({ date: getTodayDateString(), tasks: [], yesterday: null })
  const isFirstRender = useRef(true)
  const isTodayFirstRender = useRef(true)

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      const loadedData = await loadTasks()
      setData(loadedData)

      // Load today data and handle day reset
      const loaded = await loadTodayData()
      const today = getTodayDateString()
      if (loaded.date !== today) {
        setTodayData({
          date: today,
          tasks: [],
          yesterday: { date: loaded.date, tasks: loaded.tasks }
        })
      } else {
        setTodayData(loaded)
      }

      isFirstRender.current = false
      isTodayFirstRender.current = false
    }
    loadData()
  }, [])

  // Auto-save whenever data changes (skip first render)
  useEffect(() => {
    if (!isFirstRender.current) {
      saveTasks(data)
    }
  }, [data])

  // Auto-save today data whenever it changes
  useEffect(() => {
    if (!isTodayFirstRender.current) {
      saveTodayData(todayData)
    }
  }, [todayData])

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

    // Then check every minute (also checks for day rollover on today panel)
    const interval = setInterval(() => {
      checkAndClearCompletedTasks()
      // Day rollover check for Today panel
      setTodayData(prev => {
        const today = getTodayDateString()
        if (prev.date !== today) {
          return {
            date: today,
            tasks: [],
            yesterday: { date: prev.date, tasks: prev.tasks }
          }
        }
        return prev
      })
    }, 60 * 1000)

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
            pending: false,
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
            pending: false,
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

          // Remove completed tasks from Today panel
          if (newCompletedState) {
            setTodayData(prev => ({
              ...prev,
              tasks: prev.tasks.filter(ref => !affectedIds.has(ref.taskId) || ref.columnId !== columnId)
            }))
          }

          return {
            ...col,
            tasks: col.tasks.map(task => {
              if (!affectedIds.has(task.id)) return task
              // Preserve original completedAt for subtasks that were already completed
              const preserveTimestamp = newCompletedState && task.completed && task.completedAt
              return {
                ...task,
                completed: newCompletedState,
                completedAt: preserveTimestamp ? task.completedAt : completionTimestamp
              }
            })
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

          // Remove deleted tasks from Today panel
          setTodayData(prev => ({
            ...prev,
            tasks: prev.tasks.filter(ref => !idsToDelete.has(ref.taskId) || ref.columnId !== columnId)
          }))

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

  const togglePending = (columnId: string, taskId: string) => {
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id === columnId) {
          return {
            ...col,
            tasks: col.tasks.map(task =>
              task.id === taskId
                ? { ...task, pending: !task.pending }
                : task
            )
          }
        }
        return col
      })
    }))
  }

  const setDueDate = (columnId: string, taskId: string, dueDate: string) => {
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id === columnId) {
          return {
            ...col,
            tasks: col.tasks.map(task =>
              task.id === taskId
                ? { ...task, dueDate }
                : task
            )
          }
        }
        return col
      })
    }))
  }

  const removeDueDate = (columnId: string, taskId: string) => {
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id === columnId) {
          return {
            ...col,
            tasks: col.tasks.map(task => {
              if (task.id === taskId) {
                const { dueDate, ...rest } = task
                return rest as Task
              }
              return task
            })
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
    setTodayData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(ref => ref.columnId !== columnId)
    }))
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

  const addToToday = (columnId: string, taskId: string) => {
    setTodayData(prev => {
      const alreadyExists = prev.tasks.some(ref => ref.columnId === columnId && ref.taskId === taskId)
      if (alreadyExists) return prev
      return { ...prev, tasks: [...prev.tasks, { columnId, taskId }] }
    })
  }

  const removeFromToday = (columnId: string, taskId: string) => {
    setTodayData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(ref => !(ref.columnId === columnId && ref.taskId === taskId))
    }))
  }

  const restoreYesterday = () => {
    setTodayData(prev => {
      if (!prev.yesterday || prev.yesterday.tasks.length === 0) return prev
      // Filter out stale refs (tasks that no longer exist or are completed/cleared)
      const validRefs = prev.yesterday.tasks.filter(ref => {
        const col = data.columns.find(c => c.id === ref.columnId)
        if (!col) return false
        const task = col.tasks.find(t => t.id === ref.taskId)
        return task && !task.completed && !task.cleared
      })
      // Merge with existing, avoiding duplicates
      const existingKeys = new Set(prev.tasks.map(r => `${r.columnId}:${r.taskId}`))
      const newRefs = validRefs.filter(r => !existingKeys.has(`${r.columnId}:${r.taskId}`))
      return { ...prev, tasks: [...prev.tasks, ...newRefs] }
    })
  }

  return (
    <AppContext.Provider value={{ data, addColumn, deleteColumn, updateColumnColor, reorderColumns, addTask, addSubtask, toggleTask, deleteTask, updateTask, updateTaskPriority, togglePending, setDueDate, removeDueDate, toggleAutoSort, toggleColumnVisibility, clearCompleted, todayData, addToToday, removeFromToday, restoreYesterday }}>
      {children}
    </AppContext.Provider>
  )
}
