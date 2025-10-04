import React from 'react'
import { Task as TaskType } from '../types'
import './Task.css'

interface TaskProps {
  task: TaskType
  onToggle: () => void
  onDelete: () => void
}

const Task: React.FC<TaskProps> = ({ task, onToggle, onDelete }) => {
  return (
    <div className={`task ${task.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={onToggle}
        className="task-checkbox"
      />
      <span className="task-text">{task.text}</span>
      <button
        className="task-delete"
        onClick={onDelete}
        aria-label="Delete task"
      >
        ×
      </button>
    </div>
  )
}

export default Task
