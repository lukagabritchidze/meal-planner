/**
 * Mobile daily planner carousel: a horizontal day slider with the focused
 * day's meal slots below. Purely presentational; data/callbacks via props.
 */
export const MobilePlanner = ({
  daysOfWeek,
  mealSlots,
  weekDates,
  plannedMeals,
  formatDateString,
  activeMobileDayIndex,
  setActiveMobileDayIndex,
  onOpenPicker,
  onRemoveMealFromSlot,
  holidaysByDate = {},
  onViewHoliday,
}) => {
  const activeDate = weekDates[activeMobileDayIndex];
  const activeHoliday = holidaysByDate[formatDateString(activeDate)];

  return (
    <div className="mobile-daily-carousel-container">
      <div className="mobile-day-slider">
        {daysOfWeek.map((day, index) => {
          const date = weekDates[index];
          const isSelected = index === activeMobileDayIndex;
          const holiday = holidaysByDate[formatDateString(date)];
          const pillStyle = holiday && !isSelected
            ? { backgroundColor: `${holiday.color || 'var(--primary)'}22`, borderColor: holiday.color || 'var(--border-color)' }
            : undefined;

          return (
            <button
              key={day}
              type="button"
              className={`mobile-day-pill ${isSelected ? 'active' : ''}`}
              style={pillStyle}
              onClick={() => setActiveMobileDayIndex(index)}
            >
              <span className="pill-day-abbr">{day.slice(0, 3)}</span>
              <span className="pill-day-num">{date.getDate()}</span>
              {holiday && <span aria-hidden="true">{holiday.emoji || '🎉'}</span>}
            </button>
          );
        })}
      </div>

      <div className="mobile-focused-day-plan">
        <h3 className="mobile-focused-title">
          {daysOfWeek[activeMobileDayIndex]}
          <span>{activeDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
        </h3>

        {activeHoliday && (
          <button
            type="button"
            className="mobile-holiday-banner"
            onClick={() => onViewHoliday && onViewHoliday(activeHoliday)}
            style={{ borderColor: activeHoliday.color || 'var(--accent)', color: activeHoliday.color || 'var(--accent)' }}
          >
            {activeHoliday.emoji || '🎉'} {activeHoliday.name} — View Holiday Plan
          </button>
        )}

        <div className="mobile-slots-list">
          {mealSlots.map((slot) => {
            const dateString = formatDateString(activeDate);
            const slotKey = `${dateString}-${slot}`;
            const plannedRecipe = plannedMeals[slotKey];

            if (plannedRecipe) {
              return (
                <div key={slot} className="mobile-slot-card filled">
                  <div className="mobile-slot-header">
                    <span className="mobile-slot-type-badge">{slot}</span>
                    <button
                      className="mobile-slot-remove-btn"
                      onClick={() => onRemoveMealFromSlot(dateString, slot)}
                      aria-label={`Remove ${plannedRecipe.recipeTitle}`}
                    >
                      Delete
                    </button>
                  </div>
                  <div className="mobile-slot-recipe-info">
                    {plannedRecipe.recipeImagePath ? (
                      <img
                        className="mobile-slot-recipe-img"
                        src={plannedRecipe.recipeImagePath}
                        alt={plannedRecipe.recipeTitle}
                      />
                    ) : (
                      <div className="mobile-slot-recipe-img-fallback">
                        {plannedRecipe.recipeTitle.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="mobile-slot-recipe-text">
                      <h4>{plannedRecipe.recipeTitle}</h4>
                      <div className="mobile-slot-tags">
                        <span className="card-tag tag-category">{plannedRecipe.recipeCategory || 'General'}</span>
                        <span className="card-tag tag-duration">{plannedRecipe.cookingDurationMinutes} min</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <button
                key={slot}
                type="button"
                className="mobile-slot-card empty"
                onClick={() => onOpenPicker(activeDate, slot, daysOfWeek[activeMobileDayIndex])}
              >
                <div className="empty-slot-mobile-inner">
                  <span className="mobile-slot-type-badge">{slot}</span>
                  <span className="mobile-slot-add-text">+ Schedule a Meal</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
