import { useCallback, useEffect, useState } from 'react';
import { recipeManagementApiService } from '../../services/recipeManagementApiService';
import { HolidayDetailView } from './HolidayDetailView';
import { HolidayFormModal } from './HolidayFormModal';

/**
 * Page for managing holidays and entering holiday meal planning details.
 */
export const HolidayManager = ({
  recipeListPayload,
  selectedHolidayId,
  onSelectedHolidayChange,
  onHolidaysChanged,
}) => {
  const [holidays, setHolidays] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);

  const loadHolidays = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await recipeManagementApiService.fetchHolidays();
      setHolidays(data || []);
      onHolidaysChanged?.();
    } catch (error) {
      console.error('Error loading holidays:', error);
      setErrorMessage('Unable to load your holidays right now.');
    } finally {
      setIsLoading(false);
    }
  }, [onHolidaysChanged]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHolidays();
  }, [loadHolidays]);

  const handleSubmitHoliday = async (payload) => {
    setErrorMessage('');
    try {
      if (editingHoliday) {
        await recipeManagementApiService.updateHoliday(editingHoliday.holidayId, payload);
      } else {
        await recipeManagementApiService.createHoliday(payload);
      }
      setIsFormOpen(false);
      setEditingHoliday(null);
      await loadHolidays();
    } catch (error) {
      console.error('Error saving holiday:', error);
      setErrorMessage('Unable to save that holiday. Please try again.');
    }
  };

  const handleDeleteHoliday = async (holiday) => {
    if (!window.confirm(`Delete "${holiday.name}" and all planned holiday meals?`)) return;
    setErrorMessage('');
    try {
      await recipeManagementApiService.deleteHoliday(holiday.holidayId);
      if (selectedHolidayId === holiday.holidayId) {
        onSelectedHolidayChange(null);
      }
      await loadHolidays();
    } catch (error) {
      console.error('Error deleting holiday:', error);
      setErrorMessage('Unable to delete that holiday right now.');
    }
  };

  if (selectedHolidayId) {
    return (
      <HolidayDetailView
        holidayId={selectedHolidayId}
        recipeListPayload={recipeListPayload}
        onBack={() => {
          onSelectedHolidayChange(null);
          loadHolidays();
        }}
      />
    );
  }

  return (
    <section className="holiday-manager-page">
      <div className="page-header">
        <div className="header-title-block">
          <h1>My Holidays</h1>
          <p>Create special days and plan meals independently from the weekly planner.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setEditingHoliday(null);
            setIsFormOpen(true);
          }}
        >
          Add Holiday
        </button>
      </div>

      {errorMessage && <div className="inline-error-message">{errorMessage}</div>}

      {isLoading ? (
        <div className="shopping-loading-card">
          <span className="skeleton-line title" />
          <span className="skeleton-line subtitle" />
        </div>
      ) : holidays.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎉</div>
          <h3>No holidays yet</h3>
          <p>Add a birthday, festival, or celebration to begin planning.</p>
          <button type="button" className="btn btn-primary" onClick={() => setIsFormOpen(true)}>Add Holiday</button>
        </div>
      ) : (
        <div className="holiday-list-card">
          {holidays.map((holiday) => (
            <div key={holiday.holidayId} className="holiday-list-row">
              <button
                type="button"
                className="holiday-main-action"
                onClick={() => onSelectedHolidayChange(holiday.holidayId)}
              >
                <span className="holiday-row-emoji">{holiday.emoji || '🎉'}</span>
                <span className="holiday-row-text">
                  <strong>{holiday.name}</strong>
                  <span>{new Date(`${holiday.date}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </span>
                <span className="holiday-color-dot" style={{ backgroundColor: holiday.color || 'var(--primary)' }} />
              </button>
              <div className="holiday-row-actions">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => onSelectedHolidayChange(holiday.holidayId)}>
                  Plan Meals
                </button>
                <button
                  type="button"
                  className="btn-icon-soft"
                  onClick={() => {
                    setEditingHoliday(holiday);
                    setIsFormOpen(true);
                  }}
                  aria-label={`Edit ${holiday.name}`}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="btn-icon-soft danger"
                  onClick={() => handleDeleteHoliday(holiday)}
                  aria-label={`Delete ${holiday.name}`}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <HolidayFormModal
        isOpen={isFormOpen}
        holiday={editingHoliday}
        onClose={() => {
          setIsFormOpen(false);
          setEditingHoliday(null);
        }}
        onSubmit={handleSubmitHoliday}
      />
    </section>
  );
};
