import { useCallback, useEffect, useMemo, useState } from 'react';
import { recipeManagementApiService } from '../../services/recipeManagementApiService';
import { RecipePickerModal } from '../planner/RecipePickerModal';
import { ShoppingGroup } from '../shopping/ShoppingGroup';

const HOLIDAY_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];

/**
 * Detail view for one holiday, including slot-based meal planning and a
 * holiday-scoped shopping list generator.
 */
export const HolidayDetailView = ({ holidayId, recipeListPayload, onBack }) => {
  const [holiday, setHoliday] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeSlot, setActiveSlot] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [shoppingGroups, setShoppingGroups] = useState(null);

  const filteredRecipes = useMemo(() => (
    recipeListPayload.filter((recipe) => (
      recipe.recipeTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (recipe.recipeCategory && recipe.recipeCategory.toLowerCase().includes(searchTerm.toLowerCase()))
    ))
  ), [recipeListPayload, searchTerm]);

  const loadHoliday = useCallback(async () => {
    if (!holidayId) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const holidayData = await recipeManagementApiService.fetchHolidayById(holidayId);
      setHoliday(holidayData);
    } catch (error) {
      console.error('Error loading holiday:', error);
      setErrorMessage('Unable to load this holiday plan right now.');
    } finally {
      setIsLoading(false);
    }
  }, [holidayId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHoliday();
  }, [loadHoliday]);

  const mealsBySlot = useMemo(() => {
    const map = {};
    (holiday?.holidayMealPlans || []).forEach((meal) => {
      map[meal.slot] = meal;
    });
    return map;
  }, [holiday]);

  const handleAddMeal = async (recipe, servings) => {
    if (!activeSlot) return;
    setErrorMessage('');
    try {
      await recipeManagementApiService.addHolidayMeal(holidayId, {
        recipeId: recipe.recipeId,
        slot: activeSlot,
        servings,
      });
      setActiveSlot(null);
      setSearchTerm('');
      await loadHoliday();
    } catch (error) {
      console.error('Error adding holiday meal:', error);
      setErrorMessage('Unable to add that meal to the holiday plan.');
    }
  };

  const handleRemoveMeal = async (mealId) => {
    setErrorMessage('');
    try {
      await recipeManagementApiService.deleteHolidayMeal(holidayId, mealId);
      await loadHoliday();
    } catch (error) {
      console.error('Error removing holiday meal:', error);
      setErrorMessage('Unable to remove that holiday meal.');
    }
  };

  const handleGenerateShoppingList = async () => {
    setErrorMessage('');
    try {
      const shoppingGroupsData = await recipeManagementApiService.fetchHolidayShoppingList(holidayId);
      setShoppingGroups(shoppingGroupsData || {});
    } catch (error) {
      console.error('Error generating holiday shopping list:', error);
      setErrorMessage('Unable to generate the holiday shopping list.');
    }
  };

  const handleToggleHolidayShoppingItem = (department, item) => {
    setShoppingGroups((previous) => ({
      ...previous,
      [department]: (previous[department] || []).map((existing) => (
        existing.ingredientId === item.ingredientId ? { ...existing, checked: !existing.checked } : existing
      )),
    }));
  };

  if (isLoading && !holiday) {
    return <div className="shopping-loading-card"><span className="skeleton-line title" /><span className="skeleton-line subtitle" /></div>;
  }

  if (!holiday) {
    return (
      <section>
        <button type="button" className="btn btn-secondary" onClick={onBack}>← Back</button>
        {errorMessage && <div className="inline-error-message">{errorMessage}</div>}
      </section>
    );
  }

  const shoppingGroupEntries = shoppingGroups
    ? Object.entries(shoppingGroups).filter(([, items]) => items.length > 0)
    : [];

  return (
    <section className="holiday-detail-view">
      <button type="button" className="btn btn-secondary holiday-back-btn" onClick={onBack}>← Back to Holidays</button>

      <div className="holiday-detail-hero" style={{ borderColor: holiday.color || 'var(--primary)' }}>
        <span className="holiday-detail-emoji">{holiday.emoji || '🎉'}</span>
        <div>
          <h1>{holiday.name}</h1>
          <p>{new Date(`${holiday.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
      </div>

      {errorMessage && <div className="inline-error-message">{errorMessage}</div>}

      <div className="holiday-slots-grid">
        {HOLIDAY_SLOTS.map((slot) => {
          const meal = mealsBySlot[slot];
          return (
            <div key={slot} className="holiday-slot-card">
              <div className="holiday-slot-header">
                <span>{slot}</span>
                {meal && (
                  <button
                    type="button"
                    className="btn-delete-icon"
                    onClick={() => handleRemoveMeal(meal.holidayMealPlanId)}
                    aria-label={`Remove ${slot} meal`}
                  >
                    🗑
                  </button>
                )}
              </div>
              {meal ? (
                <div className="holiday-assigned-meal">
                  {meal.recipe?.recipeImagePath ? (
                    <img src={meal.recipe.recipeImagePath} alt={meal.recipe.recipeTitle} />
                  ) : (
                    <div className="holiday-recipe-fallback">{meal.recipe?.recipeTitle?.charAt(0).toUpperCase() || '?'}</div>
                  )}
                  <h3>{meal.recipe?.recipeTitle}</h3>
                  <p>{meal.servings || meal.recipe?.defaultServings || 4} servings</p>
                </div>
              ) : (
                <button type="button" className="holiday-add-card" onClick={() => setActiveSlot(slot)}>
                  + Add
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button type="button" className="btn btn-primary holiday-shopping-btn" onClick={handleGenerateShoppingList}>
        Generate Shopping List
      </button>

      <RecipePickerModal
        isOpen={Boolean(activeSlot)}
        title={`Add ${activeSlot}`}
        subtitle={`Planning ${holiday.name}`}
        recipes={filteredRecipes}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onSelectRecipe={handleAddMeal}
        onClose={() => setActiveSlot(null)}
        showServings
        emptyCatalogMessage="No matching recipes found."
      />

      {shoppingGroups && (
        <div className="modal-overlay" onClick={() => setShoppingGroups(null)}>
          <div className="modal-content holiday-shopping-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{holiday.name} Shopping List</h2>
              <button className="modal-close-btn" onClick={() => setShoppingGroups(null)} aria-label="Close holiday shopping list">×</button>
            </div>
            <div className="modal-body">
              {shoppingGroupEntries.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🛒</div>
                  <h3>No meals assigned yet</h3>
                  <p>Add recipes to holiday slots, then generate your list.</p>
                </div>
              ) : (
                <div className="shopping-groups-stack">
                  {shoppingGroupEntries.map(([department, items]) => (
                    <ShoppingGroup
                      key={department}
                      department={department}
                      items={items}
                      onToggleItem={handleToggleHolidayShoppingItem}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
