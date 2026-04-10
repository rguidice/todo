import React, { useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { PRIORITY_COLORS } from '../types'
import './TodayPanel.css'

interface TodayPanelProps {
  isOpen: boolean
}

const TodayPanel: React.FC<TodayPanelProps> = ({ isOpen }) => {
  const { data, todayData, removeFromToday, restoreYesterday, toggleTask } = useApp()

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

  // Group tasks by column
  const groupedByColumn: Map<string, { columnName: string; columnColor: string; items: { columnId: string; taskId: string; text: string; priority: string | null; pending: boolean; completed: boolean }[] }> = new Map()

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
      completed: task.completed
    })
  }

  const hasYesterday = todayData.yesterday && todayData.yesterday.tasks.length > 0

  return (
    <div className="today-panel">
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

        {Array.from(groupedByColumn.entries()).map(([columnId, group]) => (
          <div key={columnId} className="today-column-group">
            <div className="today-column-header">
              <span className="today-column-dot" style={{ backgroundColor: group.columnColor }} />
              <span className="today-column-name">{group.columnName}</span>
            </div>
            {group.items.map(item => {
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
            })}
          </div>
        ))}

        {hasYesterday && (
          <button className="today-restore-button" onClick={restoreYesterday}>
            Restore Yesterday
          </button>
        )}
      </div>
    </div>
  )
}

export default TodayPanel
