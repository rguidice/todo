import React, { useState, useEffect } from 'react'
import { AppData } from '../types'
import './ReportModal.css'

interface ReportModalProps {
  data: AppData
  onClose: () => void
  onSave: (startDate: string, endDate: string, content: string) => void
}

const ReportModal: React.FC<ReportModalProps> = ({ data, onClose, onSave }) => {
  // Default to last 7 days
  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 7)

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const [startDate, setStartDate] = useState(formatDateForInput(sevenDaysAgo))
  const [endDate, setEndDate] = useState(formatDateForInput(today))
  const [reportContent, setReportContent] = useState('')

  // Generate report whenever dates change
  useEffect(() => {
    const content = generateReport(data, startDate, endDate)
    setReportContent(content)
  }, [data, startDate, endDate])

  const handleSave = () => {
    onSave(startDate, endDate, reportContent)
  }

  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="report-modal-title">Generate Weekly Report</h2>

        <div className="report-date-range">
          <div className="report-date-input-group">
            <label htmlFor="start-date">Start Date:</label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="report-date-input-group">
            <label htmlFor="end-date">End Date:</label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="report-preview">
          <h3>Preview</h3>
          <div className="report-preview-content">
            <pre>{reportContent}</pre>
          </div>
        </div>

        <div className="report-modal-buttons">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSave} className="save-button">Save Report</button>
        </div>
      </div>
    </div>
  )
}

function generateReport(data: AppData, startDateStr: string, endDateStr: string): string {
  const startDate = new Date(startDateStr)
  startDate.setHours(0, 0, 0, 0)

  const endDate = new Date(endDateStr)
  endDate.setHours(23, 59, 59, 999)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  let markdown = `# Weekly Report: ${formatDate(startDateStr)} - ${formatDate(endDateStr)}\n\n`

  const visibleColumns = data.columns.filter(col => col.visible)

  for (const column of visibleColumns) {
    const completedTasks = column.tasks.filter(task => {
      if (!task.completed || !task.completedAt) return false
      const completedDate = new Date(task.completedAt)
      return completedDate >= startDate && completedDate <= endDate
    })

    // Only include columns that have completed tasks in the range
    if (completedTasks.length === 0) continue

    markdown += `## ${column.name}\n`

    // Build set of all tasks to include: completed tasks + their ancestors
    const tasksToInclude = new Set<string>()
    const completedTaskIds = new Set(completedTasks.map(t => t.id))

    // Helper to find all ancestors of a task
    const addAncestors = (taskId: string) => {
      tasksToInclude.add(taskId)
      const task = column.tasks.find(t => t.id === taskId)
      if (task?.parentId) {
        addAncestors(task.parentId)
      }
    }

    // Add all completed tasks and their ancestors
    for (const task of completedTasks) {
      addAncestors(task.id)
    }

    // Find root tasks (tasks with no parent, or parent not in our set)
    const rootTasks = column.tasks.filter(t =>
      tasksToInclude.has(t.id) && (t.parentId === null || !tasksToInclude.has(t.parentId))
    )

    const renderTask = (task: any, level = 0): string => {
      const indent = level === 0 ? '' : '  '.repeat(level)
      const prefix = level === 0 ? '-' : '-'

      // Determine if task is completed
      const isCompleted = completedTaskIds.has(task.id)
      const checkbox = isCompleted ? '[x]' : '[ ]'

      // Format timestamp as "MMM D, YYYY H:MM AM/PM" (only for completed tasks)
      let timestamp = ''
      if (isCompleted && task.completedAt) {
        const date = new Date(task.completedAt)
        const month = date.toLocaleDateString('en-US', { month: 'short' })
        const day = date.getDate()
        const year = date.getFullYear()
        const hours = date.getHours()
        const minutes = date.getMinutes().toString().padStart(2, '0')
        const ampm = hours >= 12 ? 'PM' : 'AM'
        const hour12 = hours % 12 || 12
        timestamp = ` (${month} ${day}, ${year} ${hour12}:${minutes} ${ampm})`
      }

      let md = `${indent}${prefix} ${checkbox} ${task.text}${timestamp}\n`

      // Render children recursively (only if they're in tasksToInclude)
      const children = column.tasks.filter(t =>
        t.parentId === task.id && tasksToInclude.has(t.id)
      )
      for (const child of children) {
        md += renderTask(child, level + 1)
      }

      return md
    }

    for (const task of rootTasks) {
      markdown += renderTask(task)
    }

    markdown += '\n'
  }

  if (visibleColumns.length === 0 || markdown === `# Weekly Report: ${formatDate(startDateStr)} - ${formatDate(endDateStr)}\n\n`) {
    markdown += '*No completed tasks in this date range.*\n'
  }

  return markdown
}

export default ReportModal
