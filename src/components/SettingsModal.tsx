import React, { useState, useEffect } from 'react'
import { AppSettings, AutoClearDuration, AUTO_CLEAR_OPTIONS } from '../types'
import './SettingsModal.css'

interface SettingsModalProps {
  onClose: () => void
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [dataDirectory, setDataDirectory] = useState('')
  const [originalDataDirectory, setOriginalDataDirectory] = useState('')
  const [autoClearDuration, setAutoClearDuration] = useState<AutoClearDuration>('never')
  const [loading, setLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await window.electron.getSettings()
        setDataDirectory(settings.dataDirectory)
        setOriginalDataDirectory(settings.dataDirectory)
        setAutoClearDuration(settings.autoClearDuration)
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleBrowse = async () => {
    const selected = await window.electron.selectDirectory()
    if (selected) {
      setDataDirectory(selected)
    }
  }

  const handleSave = async () => {
    try {
      const settings: AppSettings = {
        dataDirectory,
        autoClearDuration
      }
      await window.electron.updateSettings(settings)

      // Show success message
      setShowSuccess(true)

      // Auto-hide and close after 2 seconds
      setTimeout(() => {
        setShowSuccess(false)
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings. Please try again.')
    }
  }

  const handleReset = async () => {
    const settings = await window.electron.getSettings()
    setDataDirectory(settings.dataDirectory)
    setAutoClearDuration(settings.autoClearDuration)
  }

  if (loading) {
    return (
      <div className="settings-modal-overlay" onClick={onClose}>
        <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
          <h2 className="settings-modal-title">Settings</h2>
          <div className="settings-loading">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="settings-modal-title">Settings</h2>

        <div className="settings-section">
          <h3>Data Directory</h3>
          <p className="settings-description">
            Choose where your tasks and reports are stored.
          </p>

          <div className="settings-directory-input">
            <input
              type="text"
              value={dataDirectory}
              readOnly
              className="directory-path-input"
            />
            <button onClick={handleBrowse} className="browse-button">
              Browse...
            </button>
          </div>

          <p className="settings-note">
            Note: Changing the data directory will not move existing files.
            You'll need to manually move your data folder to the new location.
          </p>
        </div>

        <div className="settings-section">
          <h3>Auto-Clear Completed Tasks</h3>
          <p className="settings-description">
            Automatically delete completed tasks after the selected duration.
          </p>

          <select
            value={autoClearDuration}
            onChange={(e) => setAutoClearDuration(e.target.value as AutoClearDuration)}
            className="auto-clear-select"
          >
            {(Object.keys(AUTO_CLEAR_OPTIONS) as AutoClearDuration[]).map((duration) => (
              <option key={duration} value={duration}>
                {AUTO_CLEAR_OPTIONS[duration].label}
              </option>
            ))}
          </select>

          <p className="settings-note">
            Cleared tasks are hidden from view but kept for reports. Tasks are permanently deleted after 90 days to save space.
          </p>
        </div>

        <div className="settings-modal-buttons">
          <button onClick={onClose} disabled={showSuccess}>Cancel</button>
          <button onClick={handleReset} disabled={showSuccess}>Reset</button>
          <button onClick={handleSave} className="save-button" disabled={showSuccess}>
            Save Settings
          </button>
        </div>

        {showSuccess && (
          <div className="settings-success-message">
            ✓ Settings saved successfully!{dataDirectory !== originalDataDirectory && ' Restart the app to apply data directory changes.'}
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsModal
