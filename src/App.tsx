import React, { useState, useEffect, useMemo } from 'react'
import { useApp } from './context/AppContext'
import Column from './components/Column'
import Sidebar from './components/Sidebar'
import TodayPanel from './components/TodayPanel'
import ReportModal from './components/ReportModal'
import SettingsModal from './components/SettingsModal'
import { DueDateDisplayMode } from './types'
import './App.css'

function App() {
  const { data, addColumn, deleteColumn, renameColumn, updateColumnColor, reorderColumns, addTask, addSubtask, toggleTask, deleteTask, moveTask, updateTask, updateTaskPriority, togglePending, setDueDate, removeDueDate, toggleAutoSort, toggleColumnVisibility, clearCompleted, todayData, addToToday, removeFromToday } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [todayPanelOpen, setTodayPanelOpen] = useState(false)
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [dueDateDisplayMode, setDueDateDisplayMode] = useState<DueDateDisplayMode>('date')

  // Load due date display mode from settings
  const loadDueDateDisplayMode = async () => {
    try {
      const settings = await window.electron.getSettings()
      setDueDateDisplayMode(settings.dueDateDisplayMode || 'date')
    } catch (error) {
      console.error('Failed to load due date display mode:', error)
    }
  }

  useEffect(() => {
    loadDueDateDisplayMode()
  }, [])

  const visibleColumns = data.columns.filter(col => col.visible)

  // Build a map of columnId -> Set<taskId> for today panel references
  const todayTaskIdsByColumn = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const ref of todayData.tasks) {
      if (!map.has(ref.columnId)) {
        map.set(ref.columnId, new Set())
      }
      map.get(ref.columnId)!.add(ref.taskId)
    }
    return map
  }, [todayData.tasks])

  const handleDragStart = (index: number) => {
    setDraggedColumnIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (e.dataTransfer.types.includes('application/x-task')) return
    if (draggedColumnIndex === null || draggedColumnIndex === index) return

    reorderColumns(draggedColumnIndex, index)
    setDraggedColumnIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedColumnIndex(null)
  }

  const handleSaveReport = async (startDate: string, endDate: string, content: string) => {
    const filename = `completed_${startDate}_to_${endDate}.md`
    try {
      await window.electron.saveReport(filename, content)
      console.log(`Report saved: ${filename}`)
      // Don't close modal here - let ReportModal handle it with success message
    } catch (error) {
      console.error('Failed to save report:', error)
      alert('Failed to save report. Please try again.')
      throw error // Re-throw so ReportModal knows it failed
    }
  }

  return (
    <div className="app">
      <div className="top-bar">
        <button className="menu-button" onClick={() => setSidebarOpen(!sidebarOpen)}>
          ☰
        </button>
        <button className={`today-toggle-button ${todayPanelOpen ? 'active' : ''}`} onClick={() => setTodayPanelOpen(!todayPanelOpen)}>
          Today
          {todayData.tasks.length > 0 && (
            <span className="today-toggle-count">{todayData.tasks.length}</span>
          )}
        </button>
        <h1>todo</h1>
        <button className="report-button" onClick={() => setShowReportModal(true)}>Generate Report</button>
      </div>

      <div className="main-content">
        <Sidebar
          isOpen={sidebarOpen}
          columns={data.columns}
          onAddColumn={addColumn}
          onToggleColumnVisibility={toggleColumnVisibility}
          onOpenSettings={() => setShowSettingsModal(true)}
        />

        <TodayPanel isOpen={todayPanelOpen} />

        <div className="columns-container">
          {visibleColumns.length === 0 ? (
            <div className="empty-state">
              <p>No columns visible. {data.columns.length === 0 ? 'Click "☰" to add a column!' : 'Toggle columns in the sidebar.'}</p>
            </div>
          ) : (
            visibleColumns.map(column => {
              const columnIndex = data.columns.findIndex(col => col.id === column.id)
              return (
                <Column
                  key={column.id}
                  column={column}
                  onAddTask={addTask}
                  onAddSubtask={addSubtask}
                  onToggleTask={toggleTask}
                  onDeleteTask={deleteTask}
                  onMoveTask={moveTask}
                  allColumns={data.columns}
                  onUpdateTask={updateTask}
                  onUpdatePriority={updateTaskPriority}
                  onTogglePending={togglePending}
                  onSetDueDate={setDueDate}
                  onRemoveDueDate={removeDueDate}
                  dueDateDisplayMode={dueDateDisplayMode}
                  onToggleAutoSort={toggleAutoSort}
                  onClearCompleted={clearCompleted}
                  onDeleteColumn={deleteColumn}
                  onRenameColumn={renameColumn}
                  onUpdateColor={updateColumnColor}
                  onHideColumn={toggleColumnVisibility}
                  onDragStart={() => handleDragStart(columnIndex)}
                  onDragOver={(e) => handleDragOver(e, columnIndex)}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedColumnIndex === columnIndex}
                  onAddToToday={addToToday}
                  onRemoveFromToday={removeFromToday}
                  todayTaskIds={todayTaskIdsByColumn.get(column.id)}
                />
              )
            })
          )}
        </div>
      </div>

      {showReportModal && (
        <ReportModal
          data={data}
          onClose={() => setShowReportModal(false)}
          onSave={handleSaveReport}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          onClose={() => {
            setShowSettingsModal(false)
            loadDueDateDisplayMode()
          }}
        />
      )}
    </div>
  )
}

export default App
