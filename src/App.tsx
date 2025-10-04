import React, { useState } from 'react'
import { useApp } from './context/AppContext'
import Column from './components/Column'
import { GRUVBOX_COLORS } from './types'
import './App.css'

function App() {
  const { data, addColumn, addTask, toggleTask, deleteTask } = useApp()
  const [showColumnDialog, setShowColumnDialog] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')

  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      // Pick a color from Gruvbox palette (cycle through)
      const colors = Object.values(GRUVBOX_COLORS)
      const colorIndex = data.columns.length % colors.length
      addColumn(newColumnName.trim(), colors[colorIndex])
      setNewColumnName('')
      setShowColumnDialog(false)
    }
  }

  return (
    <div className="app">
      <div className="top-bar">
        <button className="menu-button" onClick={() => setShowColumnDialog(true)}>
          + Column
        </button>
        <h1>todo</h1>
        <button className="report-button">Generate Report</button>
      </div>

      <div className="main-content">
        <div className="columns-container">
          {data.columns.length === 0 ? (
            <div className="empty-state">
              <p>No columns yet. Click "+ Column" to get started!</p>
            </div>
          ) : (
            data.columns.map(column => (
              <Column
                key={column.id}
                column={column}
                onAddTask={addTask}
                onToggleTask={toggleTask}
                onDeleteTask={deleteTask}
              />
            ))
          )}
        </div>
      </div>

      {showColumnDialog && (
        <div className="dialog-overlay" onClick={() => setShowColumnDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h2>Add Column</h2>
            <input
              type="text"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="Column name..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddColumn()
                if (e.key === 'Escape') setShowColumnDialog(false)
              }}
            />
            <div className="dialog-buttons">
              <button onClick={() => setShowColumnDialog(false)}>Cancel</button>
              <button onClick={handleAddColumn} className="primary">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
