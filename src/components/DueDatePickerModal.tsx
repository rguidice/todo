import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import { DayPicker } from 'react-day-picker'
import './DueDatePickerModal.css'

interface DueDatePickerModalProps {
  currentDate?: string
  onSelect: (date: string) => void
  onClose: () => void
}

const DueDatePickerModal: React.FC<DueDatePickerModalProps> = ({ currentDate, onSelect, onClose }) => {
  const initialDate = currentDate ? new Date(currentDate + 'T00:00:00') : undefined
  const [selected, setSelected] = useState<Date | undefined>(initialDate)

  const handleConfirm = () => {
    if (selected) {
      const year = selected.getFullYear()
      const month = String(selected.getMonth() + 1).padStart(2, '0')
      const day = String(selected.getDate()).padStart(2, '0')
      onSelect(`${year}-${month}-${day}`)
    }
  }

  return ReactDOM.createPortal(
    <div className="due-date-modal-overlay" onClick={onClose}>
      <div className="due-date-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="due-date-modal-title">
          {currentDate ? 'Change Due Date' : 'Set Due Date'}
        </h2>
        <div className="due-date-calendar-container">
          <DayPicker
            mode="single"
            fixedWeeks
            selected={selected}
            onSelect={setSelected}
            defaultMonth={selected || new Date()}
          />
        </div>
        <div className="due-date-modal-buttons">
          <button onClick={onClose}>Cancel</button>
          <button
            className="confirm-button"
            onClick={handleConfirm}
            disabled={!selected}
          >
            {currentDate ? 'Update' : 'Set Date'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default DueDatePickerModal
