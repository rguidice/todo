import React, { useState, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { Task as TaskType, PRIORITY_COLORS, Priority } from '../types'
import './Task.css'

interface TaskProps {
  task: TaskType
  allTasks: TaskType[]
  autoSort?: boolean
  depth?: number
  onToggle: (taskId: string) => void
  onDelete: (taskId: string) => void
  onUpdate?: (taskId: string, text: string) => void
  onAddSubtask?: (parentId: string, text: string, priority?: Priority) => void
  onUpdatePriority?: (taskId: string, priority: Priority) => void
}

const Task: React.FC<TaskProps> = ({
  task,
  allTasks,
  autoSort = false,
  depth = 0,
  onToggle,
  onDelete,
  onUpdate,
  onAddSubtask,
  onUpdatePriority
}) => {
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [newSubtaskText, setNewSubtaskText] = useState('')
  const [newSubtaskPriority, setNewSubtaskPriority] = useState<Priority>(null)
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
  const [adjustedMenuPos, setAdjustedMenuPos] = useState({ x: 0, y: 0 })
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(task.text)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  let children = allTasks.filter(t => t.parentId === task.id && !t.cleared)

  // Sort children by priority if autoSort is enabled
  if (autoSort) {
    const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2, null: 3 }
    children = [...children].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  }

  const canHaveChildren = depth < 2 // Max 3 levels: 0, 1, 2

  const handleAddSubtaskClick = () => {
    setIsAddingSubtask(true)
  }

  const handleSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newSubtaskText.trim() && onAddSubtask) {
      onAddSubtask(task.id, newSubtaskText.trim(), newSubtaskPriority)
      setNewSubtaskText('')
      setNewSubtaskPriority(null)
      setIsAddingSubtask(false)
    }
  }

  const handleSubtaskCancel = () => {
    setNewSubtaskText('')
    setNewSubtaskPriority(null)
    setIsAddingSubtask(false)
  }

  const priorityColor = task.priority ? PRIORITY_COLORS[task.priority] : undefined

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    const pos = { x: e.clientX, y: e.clientY }
    setContextMenuPos(pos)
    setAdjustedMenuPos(pos) // Initial position, will be adjusted by useLayoutEffect
    setShowContextMenu(true)
  }

  const handleSetPriority = (priority: Priority) => {
    if (onUpdatePriority) {
      onUpdatePriority(task.id, priority)
    }
    setShowContextMenu(false)
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditText(task.text)
  }

  const handleSaveEdit = () => {
    if (editText.trim() && onUpdate) {
      onUpdate(task.id, editText.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditText(task.text)
    setIsEditing(false)
  }

  // Adjust context menu position to keep it on screen
  useLayoutEffect(() => {
    if (showContextMenu && contextMenuRef.current) {
      const menu = contextMenuRef.current
      const menuRect = menu.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let x = contextMenuPos.x
      let y = contextMenuPos.y

      // Check if menu extends past right edge
      if (x + menuRect.width > viewportWidth) {
        x = viewportWidth - menuRect.width - 10 // 10px padding from edge
      }

      // Check if menu extends past bottom edge
      if (y + menuRect.height > viewportHeight) {
        y = viewportHeight - menuRect.height - 10 // 10px padding from edge
      }

      // Ensure menu doesn't go off the top
      if (y < 10) {
        y = 10
      }

      // Ensure menu doesn't go off the left
      if (x < 10) {
        x = 10
      }

      setAdjustedMenuPos({ x, y })
    }
  }, [showContextMenu, contextMenuPos])

  return (
    <div className="task-container">
      <div
        className={`task ${task.completed ? 'completed' : ''} ${task.priority ? 'has-priority' : ''}`}
        style={{
          marginLeft: `${depth * 1.5}rem`,
          borderLeftColor: priorityColor
        }}
        onContextMenu={handleContextMenu}
      >
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          className="task-checkbox"
        />
        {isEditing ? (
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit()
              if (e.key === 'Escape') handleCancelEdit()
            }}
            className="task-edit-input"
            autoFocus
          />
        ) : (
          <span className="task-text" onDoubleClick={handleEdit}>{task.text}</span>
        )}
        {task.priority && (
          <span className="task-priority-badge" style={{ backgroundColor: priorityColor }}>
            {task.priority}
          </span>
        )}
        {canHaveChildren && !task.completed ? (
          <button
            className="task-add-subtask"
            onClick={handleAddSubtaskClick}
            aria-label="Add subtask"
            title="Add subtask"
          >
            +
          </button>
        ) : (
          <div className="task-button-spacer"></div>
        )}
      </div>

      {isAddingSubtask && (
        <form
          onSubmit={handleSubtaskSubmit}
          className="subtask-input-form"
          style={{ marginLeft: `${(depth + 1) * 1.5}rem` }}
        >
          <input
            type="text"
            value={newSubtaskText}
            onChange={(e) => setNewSubtaskText(e.target.value)}
            placeholder="Subtask name..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') handleSubtaskCancel()
            }}
          />
          <div className="priority-selector">
            <button
              type="button"
              className={`priority-btn ${newSubtaskPriority === null ? 'active' : ''}`}
              onClick={() => setNewSubtaskPriority(null)}
            >
              None
            </button>
            <button
              type="button"
              className={`priority-btn p0 ${newSubtaskPriority === 'P0' ? 'active' : ''}`}
              onClick={() => setNewSubtaskPriority('P0')}
            >
              P0
            </button>
            <button
              type="button"
              className={`priority-btn p1 ${newSubtaskPriority === 'P1' ? 'active' : ''}`}
              onClick={() => setNewSubtaskPriority('P1')}
            >
              P1
            </button>
            <button
              type="button"
              className={`priority-btn p2 ${newSubtaskPriority === 'P2' ? 'active' : ''}`}
              onClick={() => setNewSubtaskPriority('P2')}
            >
              P2
            </button>
          </div>
        </form>
      )}

      {children.map(child => (
        <Task
          key={child.id}
          task={child}
          allTasks={allTasks}
          autoSort={autoSort}
          depth={depth + 1}
          onToggle={onToggle}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onAddSubtask={onAddSubtask}
          onUpdatePriority={onUpdatePriority}
        />
      ))}

      {showContextMenu && createPortal(
        <>
          <div className="context-menu-overlay" onClick={() => setShowContextMenu(false)} />
          <div
            ref={contextMenuRef}
            className="context-menu"
            style={{ top: adjustedMenuPos.y, left: adjustedMenuPos.x }}
          >
            {canHaveChildren && !task.completed && (
              <button className="context-menu-item" onClick={() => {
                handleAddSubtaskClick()
                setShowContextMenu(false)
              }}>
                Add Subtask
              </button>
            )}
            <button className="context-menu-item danger" onClick={() => {
              onDelete(task.id)
              setShowContextMenu(false)
            }}>
              Delete Task
            </button>
            <div className="context-menu-divider"></div>
            <div className="context-menu-header">Set Priority</div>
            <button className="context-menu-item" onClick={() => handleSetPriority(null)}>
              None
            </button>
            <button className="context-menu-item p0" onClick={() => handleSetPriority('P0')}>
              P0 - High
            </button>
            <button className="context-menu-item p1" onClick={() => handleSetPriority('P1')}>
              P1 - Medium
            </button>
            <button className="context-menu-item p2" onClick={() => handleSetPriority('P2')}>
              P2 - Low
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

export default Task
