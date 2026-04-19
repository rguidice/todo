import React, { useState } from 'react'
import { Column, GRUVBOX_COLORS } from '../types'
import './Sidebar.css'

interface SidebarProps {
  isOpen: boolean
  columns: Column[]
  onAddColumn: (name: string, backgroundColor: string) => void
  onToggleColumnVisibility: (columnId: string) => void
  onArchiveColumn: (columnId: string) => void
  onRestoreColumn: (columnId: string) => void
  onDeleteColumn: (columnId: string) => void
  onOpenSettings: () => void
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  columns,
  onAddColumn,
  onToggleColumnVisibility,
  onArchiveColumn,
  onRestoreColumn,
  onDeleteColumn,
  onOpenSettings
}) => {
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [selectedColor, setSelectedColor] = useState(GRUVBOX_COLORS.softBlue)
  const [showArchived, setShowArchived] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null)

  const activeColumns = columns.filter(col => !col.archived)
  const archivedColumns = columns.filter(col => col.archived)

  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      onAddColumn(newColumnName.trim(), selectedColor)
      setNewColumnName('')
      setSelectedColor(GRUVBOX_COLORS.softBlue)
      setIsAddingColumn(false)
    }
  }

  const handleCancel = () => {
    setNewColumnName('')
    setSelectedColor(GRUVBOX_COLORS.softBlue)
    setIsAddingColumn(false)
  }

  const handleArchiveConfirm = (columnId: string) => {
    const col = columns.find(c => c.id === columnId)
    if (!col) return
    const activeCount = col.tasks.filter(t => !t.completed && !t.cleared).length
    if (activeCount > 0) {
      setArchiveConfirmId(columnId)
    } else {
      onArchiveColumn(columnId)
    }
  }

  const handleDeleteConfirm = (columnId: string) => {
    setDeleteConfirmId(columnId)
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
          {activeColumns.map(column => (
            <div key={column.id} className="column-item">
              <label className="column-item-label">
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
              <button
                className="column-archive-btn"
                onClick={() => handleArchiveConfirm(column.id)}
                title="Archive column"
              >
                ↓
              </button>
            </div>
          ))}
        </div>
      </div>

      {archivedColumns.length > 0 && (
        <div className="sidebar-section">
          <button
            className="sidebar-archive-toggle"
            onClick={() => setShowArchived(!showArchived)}
          >
            <span className={`archive-arrow ${showArchived ? 'open' : ''}`}>▶</span>
            Archived ({archivedColumns.length})
          </button>

          {showArchived && (
            <div className="archived-list">
              {archivedColumns.map(column => (
                <div key={column.id} className="archived-item">
                  <span
                    className="column-indicator"
                    style={{ backgroundColor: column.backgroundColor }}
                  />
                  <span className="column-name">{column.name}</span>
                  <button
                    className="archived-restore-btn"
                    onClick={() => onRestoreColumn(column.id)}
                    title="Restore column"
                  >
                    ↑
                  </button>
                  <button
                    className="archived-delete-btn"
                    onClick={() => handleDeleteConfirm(column.id)}
                    title="Permanently delete"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {archiveConfirmId && (() => {
        const col = columns.find(c => c.id === archiveConfirmId)
        if (!col) return null
        const activeCount = col.tasks.filter(t => !t.completed && !t.cleared).length
        return (
          <div className="sidebar-confirm-overlay" onClick={() => setArchiveConfirmId(null)}>
            <div className="sidebar-confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <h3>Archive Column?</h3>
              <p>
                <strong>{col.name}</strong> has {activeCount} active task{activeCount !== 1 ? 's' : ''}. You can restore it later from the sidebar.
              </p>
              <div className="sidebar-confirm-buttons">
                <button onClick={() => setArchiveConfirmId(null)}>Cancel</button>
                <button
                  className="primary"
                  onClick={() => {
                    onArchiveColumn(archiveConfirmId)
                    setArchiveConfirmId(null)
                  }}
                >
                  Archive
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {deleteConfirmId && (() => {
        const col = columns.find(c => c.id === deleteConfirmId)
        if (!col) return null
        const activeCount = col.tasks.filter(t => !t.completed && !t.cleared).length
        const completedCount = col.tasks.filter(t => t.completed && !t.cleared).length
        const clearedCount = col.tasks.filter(t => t.cleared).length
        const totalCount = col.tasks.length
        const parts: string[] = []
        if (activeCount > 0) parts.push(`${activeCount} active`)
        if (completedCount > 0) parts.push(`${completedCount} completed`)
        if (clearedCount > 0) parts.push(`${clearedCount} in report history`)
        return (
          <div className="sidebar-confirm-overlay" onClick={() => setDeleteConfirmId(null)}>
            <div className="sidebar-confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <h3>Permanently Delete?</h3>
              <p>
                <strong>{col.name}</strong> contains {totalCount} task{totalCount !== 1 ? 's' : ''}
                {parts.length > 0 ? ` (${parts.join(', ')})` : ''}.
              </p>
              <p>
                This will permanently remove the column, all tasks, and all history. Past completed tasks will no longer appear in generated reports. This cannot be undone.
              </p>
              <div className="sidebar-confirm-buttons">
                <button onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                <button
                  className="danger"
                  onClick={() => {
                    onDeleteColumn(deleteConfirmId)
                    setDeleteConfirmId(null)
                  }}
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      <div className="sidebar-section">
        <button className="sidebar-settings-button" onClick={onOpenSettings}>
          ⚙ Settings
        </button>
      </div>
    </div>
  )
}

export default Sidebar
