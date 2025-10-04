import React, { useState } from 'react'
import { Column as ColumnType } from '../types'
import Task from './Task'
import './Column.css'

interface ColumnProps {
  column: ColumnType
  onAddTask: (columnId: string, text: string) => void
  onToggleTask: (columnId: string, taskId: string) => void
  onDeleteTask: (columnId: string, taskId: string) => void
}

const Column: React.FC<ColumnProps> = ({ column, onAddTask, onToggleTask, onDeleteTask }) => {
  const [isAdding, setIsAdding] = useState(false)
  const [newTaskText, setNewTaskText] = useState('')

  const handleAddClick = () => {
    setIsAdding(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTaskText.trim()) {
      onAddTask(column.id, newTaskText.trim())
      setNewTaskText('')
      setIsAdding(false)
    }
  }

  const handleCancel = () => {
    setNewTaskText('')
    setIsAdding(false)
  }

  return (
    <div className="column" style={{ backgroundColor: column.backgroundColor }}>
      <h2 className="column-header">{column.name}</h2>

      <div className="tasks-list">
        {column.tasks.map(task => (
          <Task
            key={task.id}
            task={task}
            onToggle={() => onToggleTask(column.id, task.id)}
            onDelete={() => onDeleteTask(column.id, task.id)}
          />
        ))}
      </div>

      {isAdding ? (
        <form onSubmit={handleSubmit} className="task-input-form">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Task name..."
            autoFocus
            onBlur={handleCancel}
            onKeyDown={(e) => {
              if (e.key === 'Escape') handleCancel()
            }}
          />
        </form>
      ) : (
        <button className="add-task-button" onClick={handleAddClick}>
          + Add Task
        </button>
      )}
    </div>
  )
}

export default Column
