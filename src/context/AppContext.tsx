import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { AppData, Column, Task } from '../types'
import { loadTasks, saveTasks } from '../utils/storage'

interface AppContextType {
  data: AppData
  addColumn: (name: string, backgroundColor: string) => void
  addTask: (columnId: string, text: string) => void
  toggleTask: (columnId: string, taskId: string) => void
  deleteTask: (columnId: string, taskId: string) => void
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

  const addColumn = (name: string, backgroundColor: string) => {
    const newColumn: Column = {
      id: `col-${Date.now()}`,
      name,
      backgroundColor,
      visible: true,
      order: data.columns.length,
      tasks: []
    }
    setData(prev => ({
      ...prev,
      columns: [...prev.columns, newColumn]
    }))
  }

  const addTask = (columnId: string, text: string) => {
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id === columnId) {
          const newTask: Task = {
            id: `task-${Date.now()}`,
            text,
            priority: null,
            completed: false,
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

  const toggleTask = (columnId: string, taskId: string) => {
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id === columnId) {
          return {
            ...col,
            tasks: col.tasks.map(task =>
              task.id === taskId
                ? { ...task, completed: !task.completed }
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
          return {
            ...col,
            tasks: col.tasks.filter(task => task.id !== taskId)
          }
        }
        return col
      })
    }))
  }

  return (
    <AppContext.Provider value={{ data, addColumn, addTask, toggleTask, deleteTask }}>
      {children}
    </AppContext.Provider>
  )
}
