import { useState } from 'react';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameDay(first, second) {
  return Boolean(first) && Boolean(second)
    && first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

function buildMonthGrid(monthDate) {
  const firstDay = startOfMonth(monthDate);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  const days = [];
  const cursor = new Date(start);
  for (let index = 0; index < 42; index += 1) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/**
 * Reusable month calendar for picking a single date. Shared by the recipe
 * meal scheduler and the holiday form so both use the same picker.
 */
export const CalendarDatePicker = ({ value, onChange, className = '' }) => {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(value || new Date()));
  const today = new Date();

  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = buildMonthGrid(viewMonth);

  const goToPrevMonth = () => setViewMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1));
  const goToNextMonth = () => setViewMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1));

  return (
    <div className={`cal-picker ${className}`.trim()}>
      <div className="cal-header">
        <button type="button" className="cal-nav-btn" onClick={goToPrevMonth} aria-label="Previous month">‹</button>
        <span className="cal-month-label">{monthLabel}</span>
        <button type="button" className="cal-nav-btn" onClick={goToNextMonth} aria-label="Next month">›</button>
      </div>

      <div className="cal-weekdays">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className="cal-weekday">{weekday}</span>
        ))}
      </div>

      <div className="cal-grid">
        {days.map((day) => {
          const inMonth = day.getMonth() === viewMonth.getMonth();
          const classes = ['cal-day'];
          if (!inMonth) classes.push('muted');
          if (isSameDay(day, today)) classes.push('today');
          if (isSameDay(day, value)) classes.push('selected');

          return (
            <button
              type="button"
              key={day.toISOString()}
              className={classes.join(' ')}
              onClick={() => onChange(day)}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};
