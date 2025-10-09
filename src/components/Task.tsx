import React, { useState } from 'react'
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
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(task.text)

  let children = allTasks.filter(t => t.parentId === task.id)

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
    setContextMenuPos({ x: e.clientX, y: e.clientY })
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
        {canHaveChildren && !task.completed && (
          <button
            className="task-add-subtask"
            onClick={handleAddSubtaskClick}
            aria-label="Add subtask"
            title="Add subtask"
          >
            +
          </button>
        )}
        <button
          className="task-delete"
          onClick={() => onDelete(task.id)}
          aria-label="Delete task"
        >
          ×
        </button>
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

      {showContextMenu && (
        <>
          <div className="context-menu-overlay" onClick={() => setShowContextMenu(false)} />
          <div
            className="context-menu"
            style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
          >
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
        </>
      )}
    </div>
  )
}

export default Task
