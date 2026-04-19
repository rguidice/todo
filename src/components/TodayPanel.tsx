import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { Task, PRIORITY_COLORS } from '../types'
import './TodayPanel.css'

interface TodayPanelProps {
  isOpen: boolean
}

const MIN_WIDTH = 180
const MAX_WIDTH = 500
const DEFAULT_WIDTH = 260

const TodayPanel: React.FC<TodayPanelProps> = ({ isOpen }) => {
  const { data, todayData, removeFromToday, restoreYesterday, toggleTask } = useApp()
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const isResizing = useRef(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      const panel = document.querySelector('.today-panel') as HTMLElement
      if (!panel) return
      const newWidth = e.clientX - panel.getBoundingClientRect().left
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth)))
    }

    const onMouseUp = () => {
      isResizing.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [])

  // Auto-clean stale refs (task/column no longer exists)
  useEffect(() => {
    todayData.tasks.forEach(ref => {
      const col = data.columns.find(c => c.id === ref.columnId)
      if (!col) {
        removeFromToday(ref.columnId, ref.taskId)
        return
      }
      const task = col.tasks.find(t => t.id === ref.taskId)
      if (!task || task.cleared) {
        removeFromToday(ref.columnId, ref.taskId)
      }
    })
  }, [data])

  if (!isOpen) return null

  const panelStyle = { width: `${width}px` }

  // Resolve immediate parent name for a task
  const getParentName = (task: Task, allTasks: Task[]): string => {
    if (!task.parentId) return ''
    const parent = allTasks.find(t => t.id === task.parentId)
    return parent ? parent.text : ''
  }

  // Group tasks by column
  type TodayItem = { columnId: string; taskId: string; text: string; priority: string | null; pending: boolean; completed: boolean; parentName: string }
  const groupedByColumn: Map<string, { columnName: string; columnColor: string; items: TodayItem[] }> = new Map()

  for (const ref of todayData.tasks) {
    const col = data.columns.find(c => c.id === ref.columnId)
    if (!col) continue
    const task = col.tasks.find(t => t.id === ref.taskId)
    if (!task || task.completed || task.cleared) continue

    if (!groupedByColumn.has(ref.columnId)) {
      groupedByColumn.set(ref.columnId, {
        columnName: col.name,
        columnColor: col.backgroundColor,
        items: []
      })
    }
    groupedByColumn.get(ref.columnId)!.items.push({
      columnId: ref.columnId,
      taskId: ref.taskId,
      text: task.text,
      priority: task.priority,
      pending: task.pending,
      completed: task.completed,
      parentName: getParentName(task, col.tasks)
    })
  }

  const hasYesterday = todayData.yesterday && todayData.yesterday.tasks.length > 0

  return (
    <div className="today-panel" style={panelStyle}>
      <div className="today-panel-header">
        <span className="today-panel-title">Today</span>
        {todayData.tasks.length > 0 && (
          <span className="today-panel-count">{groupedByColumn.size > 0 ? Array.from(groupedByColumn.values()).reduce((sum, g) => sum + g.items.length, 0) : 0}</span>
        )}
      </div>

      <div className="today-panel-content">
        {groupedByColumn.size === 0 && !hasYesterday && (
          <div className="today-panel-empty">
            Right-click a task and select "Add to Today" to get started.
          </div>
        )}

        {groupedByColumn.size === 0 && hasYesterday && (
          <div className="today-panel-empty">
            No tasks for today yet.
          </div>
        )}

        {Array.from(groupedByColumn.entries()).map(([columnId, group]) => {
          // Sub-group items by parent chain
          const topLevel: TodayItem[] = []
          const byParent = new Map<string, TodayItem[]>()
          for (const item of group.items) {
            if (!item.parentName) {
              topLevel.push(item)
            } else {
              if (!byParent.has(item.parentName)) byParent.set(item.parentName, [])
              byParent.get(item.parentName)!.push(item)
            }
          }

          const renderTaskRow = (item: TodayItem) => {
            const priorityColor = item.priority ? PRIORITY_COLORS[item.priority as keyof typeof PRIORITY_COLORS] : undefined
            return (
              <div key={item.taskId} className="today-task-row">
                <input
                  type="checkbox"
                  className="today-task-checkbox"
                  checked={false}
                  onChange={() => toggleTask(item.columnId, item.taskId)}
                />
                <span className="today-task-text">{item.text}</span>
                {item.pending && (
                  <span className="today-task-pending">P</span>
                )}
                {item.priority && (
                  <span className="today-task-priority" style={{ backgroundColor: priorityColor }}>
                    {item.priority}
                  </span>
                )}
                <button
                  className="today-task-remove"
                  onClick={() => removeFromToday(item.columnId, item.taskId)}
                  title="Remove from Today"
                >
                  &times;
                </button>
              </div>
            )
          }

          return (
            <div key={columnId} className="today-column-group">
              <div className="today-column-header">
                <span className="today-column-dot" style={{ backgroundColor: group.columnColor }} />
                <span className="today-column-name">{group.columnName}</span>
              </div>
              {topLevel.map(renderTaskRow)}
              {Array.from(byParent.entries()).map(([parentName, items]) => (
                <div key={parentName} className="today-parent-group">
                  <div className="today-parent-header" title={parentName}>{parentName}</div>
                  {items.map(renderTaskRow)}
                </div>
              ))}
            </div>
          )
        })}

        {hasYesterday && (
          <button className="today-restore-button" onClick={restoreYesterday}>
            Restore Yesterday
          </button>
        )}
      </div>
      <div className="today-panel-resize-handle" onMouseDown={handleMouseDown} />
    </div>
  )
}

export default TodayPanel
