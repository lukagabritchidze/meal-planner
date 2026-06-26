import { useCallback, useEffect, useState } from 'react';
import { recipeManagementApiService } from '../services/recipeManagementApiService';

/**
 * PlateWise Dashboard page giving the chef a welcoming summary,
 * metrics overview, a weekly nutrition estimate, quick-access favorites,
 * and today's scheduled meals. Stats are fetched from the backend
 * GET /api/dashboard/stats endpoint for the active week.
 */
export const DashboardView = ({
  recipeListPayload,
  plannedMeals,
  mealPlansRevision,
  setActiveNavigationTab,
  weekStartDateString,
  weekEndDateString,
  onOpenRecipeDetails,
}) => {
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const loadStats = useCallback(async () => {
    if (!weekStartDateString || !weekEndDateString) return;
    setIsLoadingStats(true);
    try {
      const dashboardStatsData = await recipeManagementApiService.fetchDashboardStats(weekStartDateString, weekEndDateString);
      setStats(dashboardStatsData);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setStats(null);
    } finally {
      setIsLoadingStats(false);
    }
  }, [weekStartDateString, weekEndDateString, mealPlansRevision]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStats();
  }, [loadStats]);

  // Fallbacks derived locally so cards still show meaningful values if the
  // stats request is in flight or fails.
  const totalRecipes = stats?.totalRecipes ?? recipeListPayload.length;
  const favoriteRecipes = stats?.favoriteRecipes ?? recipeListPayload.filter((recipeItem) => recipeItem.isFavorited).length;
  const totalPlannedMeals = stats?.plannedMealsThisWeek ?? Object.values(plannedMeals).filter(Boolean).length;
  const totalItemsToBuy = stats?.distinctShoppingItems ?? 0;

  const nutrition = stats?.weeklyNutrition ?? { calories: 0, proteinGrams: 0, carbsGrams: 0, fatGrams: 0 };
  const macros = [
    { key: 'protein', label: 'Protein', grams: nutrition.proteinGrams, className: 'macro-protein' },
    { key: 'carbs', label: 'Carbs', grams: nutrition.carbsGrams, className: 'macro-carbs' },
    { key: 'fat', label: 'Fat', grams: nutrition.fatGrams, className: 'macro-fat' },
  ];
  const maxMacro = Math.max(1, ...macros.map((macroItem) => macroItem.grams));

  const favoriteShortlist = stats?.favoriteRecipeShortlist ?? [];

  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDateString = formatDateString(new Date());
  const mealSlots = ['Breakfast', 'Lunch', 'Dinner'];
  const todaysPlannedMeals = mealSlots.map((slot) => ({
    slot,
    recipe: plannedMeals[`${todayDateString}-${slot}`] || null,
  }));

  const metricCards = [
    { id: 'recipes', value: totalRecipes, label: 'Recipes saved', iconClass: 'dash-icon-green', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v8c0 1.1.9 2 2 2h3Z"></path><path d="M19 17v5"></path></svg>
    ) },
    { id: 'favorites', value: favoriteRecipes, label: 'Favorites', iconClass: 'dash-icon-red', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    ) },
    { id: 'planned', value: totalPlannedMeals, label: 'Meals planned', iconClass: 'dash-icon-red', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
    ) },
    { id: 'shopping', value: totalItemsToBuy, label: 'Items to buy', iconClass: 'dash-icon-brown', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
    ) },
  ];

  return (
    <section className="dashboard-page">

      {/* 1. WELCOME HEADER */}
      <div className="dashboard-header">
        <div className="dashboard-greeting">
          <span className="dashboard-date">{formattedToday}</span>
          <h1 className="dashboard-title">Good day, chef.</h1>
          <p className="dashboard-subtitle">Here's what's cooking this week.</p>
        </div>
        <button className="btn btn-primary dashboard-browse-btn" onClick={() => setActiveNavigationTab('recipes')}>
          Browse recipes
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>

      {/* 2. METRICS */}
      <div className="dashboard-grid">
        {metricCards.map((card) => (
          <div className="dash-card" key={card.id}>
            <div className={`dash-card-icon ${card.iconClass}`}>{card.icon}</div>
            {isLoadingStats && stats === null ? (
              <span className="skeleton-line" style={{ width: '40%', height: '2rem', marginBottom: '0.4rem' }} />
            ) : (
              <div className="dash-card-value">{card.value}</div>
            )}
            <div className="dash-card-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* 3. WEEKLY NUTRITION ESTIMATE */}
      <div className="dashboard-panel">
        <div className="dashboard-panel-header">
          <h3>Weekly nutrition</h3>
          <span className="dashboard-panel-note">Rough estimate</span>
        </div>
        {isLoadingStats && stats === null ? (
          <div className="nutrition-skeleton">
            <span className="skeleton-line" style={{ width: '30%' }} />
            <span className="skeleton-line" style={{ width: '60%' }} />
            <span className="skeleton-line" style={{ width: '45%' }} />
          </div>
        ) : (
          <div className="nutrition-content">
            <div className="nutrition-calories">
              <span className="nutrition-calories-value">{nutrition.calories.toLocaleString()}</span>
              <span className="nutrition-calories-label">estimated kcal this week</span>
            </div>
            <div className="nutrition-bars">
              {macros.map((macro) => (
                <div className="nutrition-bar-row" key={macro.key}>
                  <span className="nutrition-bar-label">{macro.label}</span>
                  <div className="nutrition-bar-track">
                    <span
                      className={`nutrition-bar-fill ${macro.className}`}
                      style={{ width: `${Math.round((macro.grams / maxMacro) * 100)}%` }}
                    />
                  </div>
                  <span className="nutrition-bar-value">{macro.grams} g</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. QUICK-ACCESS FAVORITES */}
      {(isLoadingStats || favoriteShortlist.length > 0) && (
        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h3>Favorite recipes</h3>
            <button type="button" className="dashboard-panel-link" onClick={() => setActiveNavigationTab('recipes')}>
              View all
            </button>
          </div>
          {isLoadingStats && stats === null ? (
            <div className="favorites-row">
              {[0, 1, 2].map((i) => (
                <div className="favorite-card skeleton" key={i}>
                  <span className="skeleton-banner favorite-card-thumb" />
                  <span className="skeleton-line" style={{ width: '80%', margin: '0.6rem' }} />
                </div>
              ))}
            </div>
          ) : favoriteShortlist.length === 0 ? (
            <p className="dashboard-empty-hint">No favorites yet. Tap the heart on a recipe to pin it here.</p>
          ) : (
            <div className="favorites-row">
              {favoriteShortlist.map((recipe) => (
                <button
                  type="button"
                  className="favorite-card"
                  key={recipe.recipeId}
                  onClick={() => onOpenRecipeDetails && onOpenRecipeDetails(recipe.recipeId)}
                >
                  <div className="favorite-card-thumb">
                    {recipe.recipeImagePath ? (
                      <img src={recipe.recipeImagePath} alt={recipe.recipeTitle} loading="lazy" />
                    ) : (
                      <span className="favorite-card-fallback">{recipe.recipeTitle?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="favorite-card-info">
                    <span className="favorite-card-title">{recipe.recipeTitle}</span>
                    <span className="favorite-card-meta">{recipe.cookingDurationMinutes} min</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. TODAY'S PLAN */}
      <div className="dashboard-panel">
        <div className="dashboard-panel-header">
          <h3>Today's plan</h3>
          <button type="button" className="dashboard-panel-link" onClick={() => setActiveNavigationTab('planner')}>
            Open planner
          </button>
        </div>
        <div className="today-plan-grid">
          {todaysPlannedMeals.map(({ slot, recipe }) => (
            <div className="today-plan-card" key={slot}>
              <div className="today-plan-slot-row">
                <span className="today-plan-slot">{slot}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" strokeWidth="1"><path d="M12 2l2.4 7.4L22 12l-7.6 2.6L12 22l-2.4-7.4L2 12l7.6-2.6z" /></svg>
              </div>
              {recipe ? (
                <>
                  <div className="today-plan-thumb">
                    {recipe.recipeImagePath ? (
                      <img src={recipe.recipeImagePath} alt={recipe.recipeTitle} loading="lazy" />
                    ) : (
                      <span className="today-plan-fallback">{recipe.recipeTitle.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="today-plan-recipe-title">{recipe.recipeTitle}</h4>
                    <span className="today-plan-recipe-meta">{recipe.cookingDurationMinutes} min · Easy</span>
                  </div>
                </>
              ) : (
                <button type="button" className="today-plan-add" onClick={() => setActiveNavigationTab('planner')}>
                  + Add meal
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

    </section>
  );
};
