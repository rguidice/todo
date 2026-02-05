import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { Column as ColumnType, Priority, GRUVBOX_COLORS } from '../types'
import Task from './Task'
import './Column.css'

interface ColumnProps {
  column: ColumnType
  onAddTask: (columnId: string, text: string, priority?: Priority) => void
  onToggleTask: (columnId: string, taskId: string) => void
  onDeleteTask: (columnId: string, taskId: string) => void
  onUpdateTask: (columnId: string, taskId: string, text: string) => void
  onAddSubtask: (columnId: string, parentId: string, text: string, priority?: Priority) => void
  onUpdatePriority: (columnId: string, taskId: string, priority: Priority) => void
  onTogglePending: (columnId: string, taskId: string) => void
  onToggleAutoSort: (columnId: string) => void
  onClearCompleted: (columnId: string) => void
  onDeleteColumn?: (columnId: string) => void
  onUpdateColor?: (columnId: string, color: string) => void
  onHideColumn?: (columnId: string) => void
  onDragStart?: () => void
  onDragOver?: (e: React.DragEvent) => void
  onDragEnd?: () => void
  isDragging?: boolean
}

const Column: React.FC<ColumnProps> = ({ column, onAddTask, onToggleTask, onDeleteTask, onUpdateTask, onAddSubtask, onUpdatePriority, onTogglePending, onToggleAutoSort, onClearCompleted, onDeleteColumn, onUpdateColor, onHideColumn, onDragStart, onDragOver, onDragEnd, isDragging }) => {
  const [isAdding, setIsAdding] = useState(false)
  const [newTaskText, setNewTaskText] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>(null)
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
  const [adjustedMenuPos, setAdjustedMenuPos] = useState({ x: 0, y: 0 })
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)

  const handleAddClick = () => {
    setIsAdding(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTaskText.trim()) {
      onAddTask(column.id, newTaskText.trim(), newTaskPriority)
      setNewTaskText('')
      setNewTaskPriority(null)
      setIsAdding(false)
    }
  }

  const handleCancel = () => {
    setNewTaskText('')
    setNewTaskPriority(null)
    setIsAdding(false)
  }

  // Handle clicks outside the form to close it
  useEffect(() => {
    if (!isAdding) return

    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        handleCancel()
      }
    }

    // Add a small delay to prevent immediate closing when clicking "Add Task" button
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isAdding])

  // Check if any task (including subtasks) is completed and not yet cleared
  const hasAnyCompleted = column.tasks.some(t => t.completed && !t.cleared)

  // Separate top-level tasks into uncompleted and completed (exclude cleared tasks)
  const topLevelTasks = column.tasks.filter(task => task.parentId === null && !task.cleared)
  let uncompletedTasks = topLevelTasks.filter(task => !task.completed)
  let completedTasks = topLevelTasks.filter(task => task.completed)

  // Sort by priority if autoSort is enabled
  if (column.autoSort) {
    const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2, null: 3 }
    const sortByPriority = (a: any, b: any) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }
    uncompletedTasks = [...uncompletedTasks].sort(sortByPriority)
    completedTasks = [...completedTasks].sort(sortByPriority)
  }

  const handleHeaderContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    const pos = { x: e.clientX, y: e.clientY }
    setContextMenuPos(pos)
    setAdjustedMenuPos(pos) // Initial position, will be adjusted by useLayoutEffect
    setShowContextMenu(true)
  }

  // Adjust context menu position to keep it on screen
  useLayoutEffect(() => {
    const menuElement = showColorPicker ? colorPickerRef.current : showContextMenu ? contextMenuRef.current : null

    if (menuElement) {
      const menuRect = menuElement.getBoundingClientRect()
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
  }, [showContextMenu, showColorPicker, contextMenuPos])

  const handleColorChange = (color: string) => {
    if (onUpdateColor) {
      onUpdateColor(column.id, color)
    }
    setShowColorPicker(false)
    setShowContextMenu(false)
  }

  const handleDelete = () => {
    const hasItems = column.tasks.length > 0
    if (hasItems) {
      setShowDeleteConfirm(true)
      setShowContextMenu(false)
    } else {
      if (onDeleteColumn) {
        onDeleteColumn(column.id)
      }
      setShowContextMenu(false)
    }
  }

  const confirmDelete = () => {
    if (onDeleteColumn) {
      onDeleteColumn(column.id)
    }
    setShowDeleteConfirm(false)
  }

  const handleHide = () => {
    if (onHideColumn) {
      onHideColumn(column.id)
    }
    setShowContextMenu(false)
  }

  return (
    <div
      className={`column ${isDragging ? 'dragging' : ''}`}
      style={{ backgroundColor: column.backgroundColor }}
      onDragOver={onDragOver}
    >
      <div
        className="column-header-container"
        onContextMenu={handleHeaderContextMenu}
      >
        <h2 className="column-header">{column.name}</h2>
        <div className="column-header-buttons">
          {hasAnyCompleted && (
            <button
              className="clear-completed-header-btn"
              onClick={() => onClearCompleted(column.id)}
              title="Clear completed tasks"
            >
              ✓
            </button>
          )}
          <button
            className="drag-handle"
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            title="Drag to reorder column"
          >
            ⋮⋮
          </button>
          <button
            className={`auto-sort-toggle ${column.autoSort ? 'active' : ''}`}
            onClick={() => onToggleAutoSort(column.id)}
            title="Toggle auto-sort by priority"
          >
            {column.autoSort ? '↓' : '↕'}
          </button>
        </div>
      </div>

      <div className="tasks-list">
        {/* Uncompleted tasks */}
        {uncompletedTasks.map(task => (
          <Task
            key={task.id}
            task={task}
            allTasks={column.tasks}
            autoSort={column.autoSort}
            onToggle={(taskId) => onToggleTask(column.id, taskId)}
            onDelete={(taskId) => onDeleteTask(column.id, taskId)}
            onUpdate={(taskId, text) => onUpdateTask(column.id, taskId, text)}
            onAddSubtask={(parentId, text, priority) => onAddSubtask(column.id, parentId, text, priority)}
            onUpdatePriority={(taskId, priority) => onUpdatePriority(column.id, taskId, priority)}
            onTogglePending={(taskId) => onTogglePending(column.id, taskId)}
          />
        ))}

        {/* Completed tasks section */}
        {completedTasks.length > 0 && (
          <>
            <div className="completed-separator"></div>
            {completedTasks.map(task => (
              <Task
                key={task.id}
                task={task}
                allTasks={column.tasks}
                autoSort={column.autoSort}
                onToggle={(taskId) => onToggleTask(column.id, taskId)}
                onDelete={(taskId) => onDeleteTask(column.id, taskId)}
                onUpdate={(taskId, text) => onUpdateTask(column.id, taskId, text)}
                onAddSubtask={(parentId, text, priority) => onAddSubtask(column.id, parentId, text, priority)}
                onUpdatePriority={(taskId, priority) => onUpdatePriority(column.id, taskId, priority)}
                onTogglePending={(taskId) => onTogglePending(column.id, taskId)}
              />
            ))}
            <button
              className="clear-completed-button"
              onClick={() => onClearCompleted(column.id)}
            >
              Clear Completed
            </button>
          </>
        )}
      </div>

      {isAdding ? (
        <form ref={formRef} onSubmit={handleSubmit} className="task-input-form">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Task name..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') handleCancel()
            }}
          />
          <div className="priority-selector">
            <button
              type="button"
              className={`priority-btn ${newTaskPriority === null ? 'active' : ''}`}
              onClick={() => setNewTaskPriority(null)}
            >
              None
            </button>
            <button
              type="button"
              className={`priority-btn p0 ${newTaskPriority === 'P0' ? 'active' : ''}`}
              onClick={() => setNewTaskPriority('P0')}
            >
              P0
            </button>
            <button
              type="button"
              className={`priority-btn p1 ${newTaskPriority === 'P1' ? 'active' : ''}`}
              onClick={() => setNewTaskPriority('P1')}
            >
              P1
            </button>
            <button
              type="button"
              className={`priority-btn p2 ${newTaskPriority === 'P2' ? 'active' : ''}`}
              onClick={() => setNewTaskPriority('P2')}
            >
              P2
            </button>
          </div>
        </form>
      ) : (
        <button className="add-task-button" onClick={handleAddClick}>
          + Add Task
        </button>
      )}

      {/* Context Menu */}
      {showContextMenu && createPortal(
        <>
          <div className="context-menu-overlay" onClick={() => setShowContextMenu(false)} />
          <div
            ref={contextMenuRef}
            className="column-context-menu"
            style={{ top: adjustedMenuPos.y, left: adjustedMenuPos.x }}
          >
            <button className="context-menu-item" onClick={() => setShowColorPicker(true)}>
              Change Color
            </button>
            <button className="context-menu-item" onClick={handleHide}>
              Hide Column
            </button>
            <button className="context-menu-item danger" onClick={handleDelete}>
              Delete Column
            </button>
          </div>
        </>,
        document.body
      )}

      {/* Color Picker */}
      {showColorPicker && createPortal(
        <>
          <div className="context-menu-overlay" onClick={() => {
            setShowColorPicker(false)
            setShowContextMenu(false)
          }} />
          <div
            ref={colorPickerRef}
            className="color-picker-menu"
            style={{ top: adjustedMenuPos.y, left: adjustedMenuPos.x }}
          >
            <div className="color-picker-header">Select Color</div>
            <div className="color-picker-grid">
              {Object.entries(GRUVBOX_COLORS).map(([name, color]) => (
                <button
                  key={name}
                  className={`color-option-menu ${column.backgroundColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                  title={name}
                />
              ))}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && createPortal(
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Delete Column?</h3>
            <p>This column contains {column.tasks.length} task{column.tasks.length !== 1 ? 's' : ''}. Are you sure you want to delete it?</p>
            <div className="dialog-buttons">
              <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button onClick={confirmDelete} className="danger">Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default Column
