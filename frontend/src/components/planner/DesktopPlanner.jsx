import styles from './DesktopPlanner.module.css';

/**
 * Desktop weekly planner grid (7 columns x 3 meal slots).
 * Purely presentational: all data and callbacks arrive via props.
 */
export const DesktopPlanner = ({
  daysOfWeek,
  mealSlots,
  weekDates,
  plannedMeals,
  formatDateString,
  onOpenPicker,
  onRemoveMealFromSlot,
  holidaysByDate = {},
  onViewHoliday,
}) => {
  const todayString = formatDateString(new Date());

  return (
    <div className="desktop-weekly-grid">
      <div className="planner-grid">
        {daysOfWeek.map((day, dayIndex) => {
          const date = weekDates[dayIndex];
          const dayAbbr = day.slice(0, 3).toUpperCase();
          const dateString = formatDateString(date);
          const isToday = dateString === todayString;
          const holiday = holidaysByDate[dateString];

          const headerClassName = [
            styles.dayHeader,
            isToday ? styles.dayHeaderToday : '',
            holiday ? styles.dayHeaderHoliday : '',
          ].filter(Boolean).join(' ');

          const headerStyle = holiday && !isToday
            ? { backgroundColor: `${holiday.color || 'var(--primary)'}22` }
            : undefined;

          return (
            <div key={day} className="planner-day-col">
              <div className={headerClassName} style={headerStyle}>
                <span className={styles.dayAbbr}>{dayAbbr}</span>
                <span className={styles.dayNum}>{date.getDate()}</span>
                {holiday && (
                  <div
                    className={styles.holidayChip}
                    style={{ color: holiday.color || 'var(--accent)' }}
                    onClick={() => onViewHoliday && onViewHoliday(holiday)}
                    title={`View ${holiday.name} plan`}
                  >
                    <span>{holiday.emoji || '🎉'}</span>
                    <span>{holiday.name}</span>
                  </div>
                )}
              </div>

              {mealSlots.map((slot) => {
                const slotKey = `${dateString}-${slot}`;
                const plannedRecipe = plannedMeals[slotKey];

                if (plannedRecipe) {
                  return (
                    <div key={slot} className="planner-slot filled">
                      <div className="planner-slot-label">{slot}</div>
                      <div className="planner-mini-card">
                        {plannedRecipe.recipeImagePath ? (
                          <img
                            className="planner-mini-thumb"
                            src={plannedRecipe.recipeImagePath}
                            alt={plannedRecipe.recipeTitle}
                          />
                        ) : (
                          <div className="planner-mini-thumb-fallback">
                            {plannedRecipe.recipeTitle.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="planner-mini-title" title={plannedRecipe.recipeTitle}>
                          {plannedRecipe.recipeTitle}
                        </span>
                        <button
                          className="planner-mini-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveMealFromSlot(dateString, slot);
                          }}
                          aria-label={`Remove ${plannedRecipe.recipeTitle} from ${day} ${slot}`}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={slot}
                    className="planner-slot"
                    onClick={() => onOpenPicker(date, slot, day)}
                  >
                    <div className="planner-slot-label">{slot}</div>
                    <div className="planner-slot-add">+ Add Meal</div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
