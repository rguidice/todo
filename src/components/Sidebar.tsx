import React, { useState } from 'react'
import { Column, GRUVBOX_COLORS } from '../types'
import './Sidebar.css'

interface SidebarProps {
  isOpen: boolean
  columns: Column[]
  onAddColumn: (name: string, backgroundColor: string) => void
  onToggleColumnVisibility: (columnId: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  columns,
  onAddColumn,
  onToggleColumnVisibility
}) => {
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [selectedColor, setSelectedColor] = useState(GRUVBOX_COLORS.warmBlue)

  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      onAddColumn(newColumnName.trim(), selectedColor)
      setNewColumnName('')
      setSelectedColor(GRUVBOX_COLORS.warmBlue)
      setIsAddingColumn(false)
    }
  }

  const handleCancel = () => {
    setNewColumnName('')
    setSelectedColor(GRUVBOX_COLORS.warmBlue)
    setIsAddingColumn(false)
  }

  if (!isOpen) return null

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-title">Columns</h3>

        {!isAddingColumn ? (
          <button className="sidebar-add-button" onClick={() => setIsAddingColumn(true)}>
            + Add Column
          </button>
        ) : (
          <div className="add-column-form">
            <input
              type="text"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="Column name..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddColumn()
                if (e.key === 'Escape') handleCancel()
              }}
              className="column-name-input"
            />

            <div className="color-picker">
              {Object.entries(GRUVBOX_COLORS).map(([name, color]) => (
                <button
                  key={name}
                  className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                  title={name}
                />
              ))}
            </div>

            <div className="form-buttons">
              <button onClick={handleCancel} className="btn-cancel">Cancel</button>
              <button onClick={handleAddColumn} className="btn-add">Add</button>
            </div>
          </div>
        )}

        <div className="columns-list">
          {columns.map(column => (
            <label key={column.id} className="column-item">
              <input
                type="checkbox"
                checked={column.visible}
                onChange={() => onToggleColumnVisibility(column.id)}
              />
              <span
                className="column-indicator"
                style={{ backgroundColor: column.backgroundColor }}
              />
              <span className="column-name">{column.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <button className="sidebar-settings-button">
          ⚙ Settings
        </button>
      </div>
    </div>
  )
}

export default Sidebar
