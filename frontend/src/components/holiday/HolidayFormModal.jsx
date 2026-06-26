import { useEffect, useState } from 'react';
import { CalendarDatePicker } from '../common/CalendarDatePicker';

const EMOJIS = ['🎂', '🎄', '🎃', '🎆', '🎇', '🌙', '⭐', '🥂', '🎊', '🎁', '🏖️', '🎓', '🕌', '🕍', '⛪', '🛕'];
const COLORS = ['#FF6B6B', '#4A7C59', '#6BAF7E', '#E09B3D', '#8E5EB5', '#1565C0', '#D94F3D', '#2E7D32'];

function parseDateString(value) {
  return value ? new Date(`${value}T00:00:00`) : null;
}

function formatDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Modal for creating and editing holidays.
 */
export const HolidayFormModal = ({ isOpen, holiday, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [emoji, setEmoji] = useState('🎉');
  const [color, setColor] = useState('#FF6B6B');
  const [formError, setFormError] = useState('');

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (holiday) {
      setName(holiday.name || '');
      setDate(holiday.date || '');
      setEmoji(holiday.emoji || '🎉');
      setColor(holiday.color || '#FF6B6B');
    } else {
      setName('');
      setDate('');
      setEmoji('🎉');
      setColor('#FF6B6B');
    }
    setFormError('');
  }, [holiday, isOpen]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!isOpen) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!name.trim() || !date) {
      setFormError('Please enter a holiday name and date.');
      return;
    }
    onSubmit({ name: name.trim(), date, emoji, color });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{holiday ? 'Edit Holiday' : 'Add Holiday'}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close holiday form">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {formError && <div className="inline-error-message">{formError}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="holiday-name">Holiday Name</label>
              <input
                id="holiday-name"
                type="text"
                className="form-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <span className="form-label">Date</span>
              {date && (
                <p className="holiday-date-readout">
                  {parseDateString(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              )}
              <CalendarDatePicker
                value={parseDateString(date)}
                onChange={(picked) => setDate(formatDateString(picked))}
              />
            </div>

            <div className="form-group">
              <span className="form-label">Emoji</span>
              <div className="holiday-picker-grid">
                {EMOJIS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`holiday-emoji-option ${emoji === option ? 'active' : ''}`}
                    onClick={() => setEmoji(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <span className="form-label">Color</span>
              <div className="holiday-color-grid">
                {COLORS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`holiday-color-option ${color === option ? 'active' : ''}`}
                    style={{ backgroundColor: option }}
                    onClick={() => setColor(option)}
                    aria-label={`Choose color ${option}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Holiday</button>
          </div>
        </form>
      </div>
    </div>
  );
};
