import { useState } from 'react';
import { DesktopPlanner } from './planner/DesktopPlanner';
import { MobilePlanner } from './planner/MobilePlanner';
import { RecipePickerModal } from './planner/RecipePickerModal';

/**
 * An interactive weekly meal planning dashboard displaying a responsive layout:
 * - Desktop: 7-column x 3-row grid (<DesktopPlanner>)
 * - Mobile (<= 768px): Horizontal day scroller with focused day card (<MobilePlanner>)
 */
export const MealPlannerView = ({
  recipeListPayload,
  plannedMeals,
  onAddMealToSlot,
  onRemoveMealFromSlot,
  setCurrentWeekOffset,
  weekDates,
  formatDateString,
  holidaysByDate = {},
  onViewHoliday,
}) => {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealSlots = ['Breakfast', 'Lunch', 'Dinner'];

  // State for tracking active day in mobile carousel view
  const [activeMobileDayIndex, setActiveMobileDayIndex] = useState(0);

  // State for recipe picker modal
  const [activePickerSlot, setActivePickerSlot] = useState(null); // { dateString, slot, dayLabel }
  const [modalSearchTerm, setModalSearchTerm] = useState('');

  // Format date range for header display (e.g. "Jun 1 - Jun 7")
  const formatDateRange = () => {
    const firstDate = weekDates[0];
    const lastDate = weekDates[6];

    const firstMonth = firstDate.toLocaleDateString('en-US', { month: 'short' });
    const lastMonth = lastDate.toLocaleDateString('en-US', { month: 'short' });

    const firstDay = firstDate.getDate();
    const lastDay = lastDate.getDate();

    if (firstMonth === lastMonth) {
      return `${firstMonth} ${firstDay} – ${lastDay}`;
    }
    return `${firstMonth} ${firstDay} – ${lastMonth} ${lastDay}`;
  };

  const handlePreviousWeek = () => setCurrentWeekOffset((prev) => prev - 1);
  const handleNextWeek = () => setCurrentWeekOffset((prev) => prev + 1);

  // Helper to open recipe selector modal
  const handleOpenPicker = (date, slot, dayLabel) => {
    const dateStr = formatDateString(date);
    setActivePickerSlot({ dateString: dateStr, slot, dayLabel });
    setModalSearchTerm('');
  };

  // Helper to handle recipe choice
  const handleSelectRecipe = (recipe) => {
    if (activePickerSlot) {
      onAddMealToSlot(activePickerSlot.dateString, activePickerSlot.slot, recipe);
      setActivePickerSlot(null);
    }
  };

  // Filter recipes for the search box inside modal
  const filteredModalRecipes = recipeListPayload.filter(
    (recipe) =>
      recipe.recipeTitle.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
      (recipe.recipeCategory && recipe.recipeCategory.toLowerCase().includes(modalSearchTerm.toLowerCase()))
  );

  return (
    <section>
      <div className="page-header">
        <div className="header-title-block">
          <h1>Meal Planner</h1>
          <p>Plan your breakfasts, lunches and dinners for the week.</p>
        </div>
      </div>

      <div className="planner-nav">
        <button className="planner-nav-btn" onClick={handlePreviousWeek} aria-label="Previous week">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="planner-date-range">{formatDateRange()}</span>
        <button className="planner-nav-btn" onClick={handleNextWeek} aria-label="Next week">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <DesktopPlanner
        daysOfWeek={daysOfWeek}
        mealSlots={mealSlots}
        weekDates={weekDates}
        plannedMeals={plannedMeals}
        formatDateString={formatDateString}
        onOpenPicker={handleOpenPicker}
        onRemoveMealFromSlot={onRemoveMealFromSlot}
        holidaysByDate={holidaysByDate}
        onViewHoliday={onViewHoliday}
      />

      <MobilePlanner
        daysOfWeek={daysOfWeek}
        mealSlots={mealSlots}
        weekDates={weekDates}
        plannedMeals={plannedMeals}
        formatDateString={formatDateString}
        activeMobileDayIndex={activeMobileDayIndex}
        setActiveMobileDayIndex={setActiveMobileDayIndex}
        onOpenPicker={handleOpenPicker}
        onRemoveMealFromSlot={onRemoveMealFromSlot}
        holidaysByDate={holidaysByDate}
        onViewHoliday={onViewHoliday}
      />

      <RecipePickerModal
        isOpen={Boolean(activePickerSlot)}
        title={activePickerSlot ? `Schedule ${activePickerSlot.slot}` : ''}
        subtitle={activePickerSlot ? `Planning for ${activePickerSlot.dayLabel}, ${activePickerSlot.dateString}` : ''}
        recipes={filteredModalRecipes}
        searchTerm={modalSearchTerm}
        onSearchTermChange={setModalSearchTerm}
        onSelectRecipe={handleSelectRecipe}
        onClose={() => setActivePickerSlot(null)}
        emptyCatalogMessage={
          recipeListPayload.length === 0
            ? 'No recipes available. Go create some recipes in the Recipe Manager tab first!'
            : 'No matching recipes found in your catalog.'
        }
      />
    </section>
  );
};
