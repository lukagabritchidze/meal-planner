import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppLayout } from './components/AppLayout';
import { RecipeGrid } from './components/RecipeGrid';
import { RecipeManualInputFormModal } from './components/RecipeManualInputFormModal';
import { RecipeDetailsSidePanel } from './components/RecipeDetailsSidePanel';
import { DashboardView } from './components/DashboardView';
import { MealPlannerView } from './components/MealPlannerView';
import { ShoppingList } from './components/shopping/ShoppingList';
import { HolidayManager } from './components/holiday/HolidayManager';
import { recipeManagementApiService } from './services/recipeManagementApiService';
import { AuthView } from './components/AuthView';

function App() {
  // Authentication State (loaded from localStorage for persistence)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('platewise_authenticated_user');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Error reading authenticated user from localStorage:", error);
      return null;
    }
  });

  const handleAuthSuccess = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('platewise_authenticated_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('platewise_authenticated_user');
    setActiveNavigationTab('dashboard');
  };

  // Navigation active tab controller (default to dashboard)
  const [activeNavigationTab, setActiveNavigationTab] = useState('dashboard');

  // Recipes list states
  const [recipeListPayload, setRecipeListPayload] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Modal / drawer states
  const [isRecipeFormModalOpen, setIsRecipeFormModalOpen] = useState(false);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState(null);

  // Active Holiday Theme State
  const [activeHolidayTheme, setActiveHolidayTheme] = useState('None');

  // Search, holiday, and ingredient filters API handlers
  const handleSearchRecipes = async (query, category) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const recipesResponse = await recipeManagementApiService.searchRecipes(query, category);
      setRecipeListPayload(recipesResponse);
    } catch (error) {
      console.error("Error searching recipes:", error);
      setApiError("Failed to search recipes. Please check your backend.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchRecipesByIngredients = async (ingredientsList) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const recipesResponse = await recipeManagementApiService.searchRecipesByIngredients(ingredientsList);
      setRecipeListPayload(recipesResponse);
    } catch (error) {
      console.error("Error searching recipes by ingredients:", error);
      setApiError("Failed to search recipes by ingredients.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHoliday = async (holidayName) => {
    setActiveHolidayTheme(holidayName);
    if (holidayName === 'None') {
      await loadAllRecipes();
      return;
    }
    setIsLoading(true);
    setApiError(null);
    try {
      const recipesResponse = await recipeManagementApiService.searchRecipesByHoliday(holidayName);
      setRecipeListPayload(recipesResponse);
    } catch (error) {
      console.error(`Error searching recipes by holiday ${holidayName}:`, error);
      setApiError(`Failed to fetch ${holidayName} recipes.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Central Week Range offset state
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Meal Planner Schedule State
  const [plannedMeals, setPlannedMeals] = useState({});
  const [selectedHolidayId, setSelectedHolidayId] = useState(null);
  const [weekHolidays, setWeekHolidays] = useState([]);

  const getWeekDates = (offsetWeeks) => {
    const dates = [];
    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday + offsetWeeks * 7);

    for (let index = 0; index < 7; index++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      dates.push(date);
    }
    return dates;
  };

  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const weekDates = getWeekDates(currentWeekOffset);
  const weekStartDateString = formatDateString(weekDates[0]);
  const weekEndDateString = formatDateString(weekDates[6]);

  const holidaysByDate = useMemo(() => {
    const map = {};
    weekHolidays.forEach((holiday) => {
      if (!map[holiday.date]) {
        map[holiday.date] = holiday;
      }
    });
    return map;
  }, [weekHolidays]);

  const loadWeekHolidays = useCallback(async () => {
    try {
      const holidays = await recipeManagementApiService.fetchHolidaysInRange(weekStartDateString, weekEndDateString);
      setWeekHolidays(holidays || []);
    } catch (error) {
      console.error('Error loading holidays for week:', error);
      setWeekHolidays([]);
    }
  }, [weekStartDateString, weekEndDateString]);

  // Load planned meals from backend REST API
  const loadMealPlans = async () => {
    try {
      const startDateStr = formatDateString(weekDates[0]);
      const endDateStr = formatDateString(weekDates[6]);
      const plans = await recipeManagementApiService.fetchMealPlans(startDateStr, endDateStr);
      
      const map = {};
      plans.forEach(plan => {
        // Camel case slot type, e.g. "BREAKFAST" -> "Breakfast"
        const slot = plan.mealSlotType.charAt(0) + plan.mealSlotType.slice(1).toLowerCase();
        const key = `${plan.plannedDate}-${slot}`;
        map[key] = {
          ...plan.recipe,
          mealPlanId: plan.mealPlanId
        };
      });
      setPlannedMeals(map);
    } catch (error) {
      console.error("Error loading meal plans from REST API:", error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMealPlans();
    // loadMealPlans closes over the current computed week range.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekOffset]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadWeekHolidays();
  }, [loadWeekHolidays]);

  const handleViewHolidayPlan = useCallback((holiday) => {
    setSelectedHolidayId(holiday.holidayId);
    setActiveNavigationTab('holidays');
  }, [setSelectedHolidayId, setActiveNavigationTab]);

  // ==========================================
  // API SERVICE CALL HANDLERS
  // ==========================================

  // Load all recipes from database
  const loadAllRecipes = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const recipesResponse = await recipeManagementApiService.fetchAllRecipes();
      setRecipeListPayload(recipesResponse);
    } catch (error) {
      console.error("Error loading recipes from REST API:", error);
      setApiError("Failed to communicate with PlateWise backend server. Please verify the Spring Boot service is active.");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadAllRecipes();
  }, []);

  // Fetch recipe details and slide open side panel
  const handleOpenRecipeDetails = async (recipeId) => {
    try {
      const details = await recipeManagementApiService.fetchRecipeDetailsById(recipeId);
      setSelectedRecipeDetail(details);
      setIsDetailPanelOpen(true);
    } catch (error) {
      console.error(`Error loading details for recipe ID ${recipeId}:`, error);
      alert("Failed to load recipe details. Please verify the backend is active.");
    }
  };

  // Toggle favorite status of a recipe
  const handleToggleRecipeFavorite = async (recipeId) => {
    try {
      // Optimitic update to make UI snappy
      setRecipeListPayload(previousList => 
        previousList.map(recipe => 
          recipe.recipeId === recipeId 
            ? { ...recipe, isFavorited: !recipe.isFavorited } 
            : recipe
        )
      );

      // Perform actual API request
      const updatedRecipe = await recipeManagementApiService.toggleRecipeFavoriteStatus(recipeId);

      // Align state with backend response
      setRecipeListPayload(previousList =>
        previousList.map(recipe =>
          recipe.recipeId === recipeId ? updatedRecipe : recipe
        )
      );

      // Synchronize in-view details drawer if currently open
      if (selectedRecipeDetail && selectedRecipeDetail.recipeId === recipeId) {
        setSelectedRecipeDetail(updatedRecipe);
      }

      // Synchronize planned meals in schedule
      setPlannedMeals(previousMeals => {
        const nextMeals = { ...previousMeals };
        let hasChanges = false;
        Object.keys(nextMeals).forEach(key => {
          if (nextMeals[key] && nextMeals[key].recipeId === recipeId) {
            nextMeals[key] = { ...nextMeals[key], isFavorited: updatedRecipe.isFavorited };
            hasChanges = true;
          }
        });
        return hasChanges ? nextMeals : previousMeals;
      });

    } catch (error) {
      console.error(`Error toggling favorite for recipe ID ${recipeId}:`, error);
      // Revert optimism if server request failed
      loadAllRecipes();
    }
  };

  // Save new recipe
  const handleSaveNewRecipe = async (recipePayload) => {
    try {
      await recipeManagementApiService.createNewManualRecipe(recipePayload);
      setIsRecipeFormModalOpen(false);
      await loadAllRecipes();
    } catch (error) {
      console.error("Error saving manual recipe:", error);
      alert("Failed to save new recipe. Please verify the input values and try again.");
    }
  };

  // Delete recipe permanently
  const handleDeleteRecipe = async (recipeId) => {
    try {
      await recipeManagementApiService.deleteRecipeById(recipeId);
      setIsDetailPanelOpen(false);
      setSelectedRecipeDetail(null);
      await loadAllRecipes();

      // Clean up planner assignments to prevent broken references
      setPlannedMeals(previousMeals => {
        const nextMeals = { ...previousMeals };
        let hasChanges = false;
        Object.keys(nextMeals).forEach(key => {
          if (nextMeals[key] && nextMeals[key].recipeId === recipeId) {
            nextMeals[key] = null;
            hasChanges = true;
          }
        });
        return hasChanges ? nextMeals : previousMeals;
      });
    } catch (error) {
      console.error(`Error deleting recipe ID ${recipeId}:`, error);
      alert("Failed to delete recipe. Please try again.");
    }
  };

  // ==========================================
  // MEAL PLANNER STATE MUTATORS (DATABASE BACKED)
  // ==========================================
  const handleAddMealToSlot = async (dateStr, slot, recipe) => {
    try {
      const slotType = slot.toUpperCase(); // "BREAKFAST", "LUNCH", "DINNER"
      const payload = {
        plannedDate: dateStr,
        mealSlotType: slotType,
        recipeId: recipe.recipeId
      };
      
      // Perform API call
      const savedPlan = await recipeManagementApiService.addMealPlan(payload);
      
      // Update state
      const key = `${dateStr}-${slot}`;
      setPlannedMeals(prev => ({
        ...prev,
        [key]: {
          ...recipe,
          mealPlanId: savedPlan.mealPlanId
        }
      }));
    } catch (error) {
      console.error("Error scheduling meal plan:", error);
      alert("Failed to schedule meal. Please try again.");
    }
  };

  const handleRemoveMealFromSlot = async (dateStr, slot) => {
    const key = `${dateStr}-${slot}`;
    const plan = plannedMeals[key];
    if (!plan || !plan.mealPlanId) return;

    try {
      await recipeManagementApiService.deleteMealPlan(plan.mealPlanId);
      
      setPlannedMeals(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (error) {
      console.error("Error removing meal plan:", error);
      alert("Failed to remove scheduled meal. Please try again.");
    }
  };

  // ==========================================
  // RENDER DYNAMIC PAGE VIEWS
  // ==========================================
  const renderActiveView = () => {
    switch (activeNavigationTab) {
      case 'dashboard':
        return (
          <DashboardView
            recipeListPayload={recipeListPayload}
            plannedMeals={plannedMeals}
            setActiveNavigationTab={setActiveNavigationTab}
            weekStartDateString={weekStartDateString}
            weekEndDateString={weekEndDateString}
            onOpenRecipeDetails={handleOpenRecipeDetails}
          />
        );

      case 'recipes':
        return (
          <RecipeGrid
            recipeListPayload={recipeListPayload}
            isLoading={isLoading}
            onViewDetails={handleOpenRecipeDetails}
            onToggleFavorite={handleToggleRecipeFavorite}
            onDeleteRecipe={handleDeleteRecipe}
            onAddNewRecipeTrigger={() => setIsRecipeFormModalOpen(true)}
            onSearch={handleSearchRecipes}
            onSearchIngredients={handleSearchRecipesByIngredients}
            activeHoliday={activeHolidayTheme}
            onSelectHoliday={handleSelectHoliday}
          />
        );

      case 'planner':
        return (
          <MealPlannerView
            recipeListPayload={recipeListPayload}
            plannedMeals={plannedMeals}
            onAddMealToSlot={handleAddMealToSlot}
            onRemoveMealFromSlot={handleRemoveMealFromSlot}
            setCurrentWeekOffset={setCurrentWeekOffset}
            weekDates={weekDates}
            formatDateString={formatDateString}
            holidaysByDate={holidaysByDate}
            onViewHoliday={handleViewHolidayPlan}
          />
        );

      case 'shopping':
        return (
          <ShoppingList
            setCurrentWeekOffset={setCurrentWeekOffset}
            weekDates={weekDates}
            formatDateString={formatDateString}
            onGoToPlanner={() => setActiveNavigationTab('planner')}
          />
        );

      case 'holidays':
        return (
          <HolidayManager
            recipeListPayload={recipeListPayload}
            selectedHolidayId={selectedHolidayId}
            onSelectedHolidayChange={setSelectedHolidayId}
            onHolidaysChanged={loadWeekHolidays}
          />
        );

      default:
        return <div>View not implemented.</div>;
    }
  };

  if (!currentUser) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <AppLayout
      activeNavigationTab={activeNavigationTab}
      setActiveNavigationTab={setActiveNavigationTab}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      {/* REST API Connection Failure Warning Banner */}
      {apiError && (
        <div className="error-banner">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            style={{ flexShrink: 0 }}
          >
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <strong>REST Server Connection Lost</strong>
            <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>{apiError}</span>
          </div>
          <button 
            type="button"
            className="btn btn-secondary btn-sm" 
            style={{ marginLeft: 'auto', padding: '0.4rem 0.85rem', fontSize: '0.85rem', whiteSpace: 'nowrap', backgroundColor: 'var(--color-bg-card)' }}
            onClick={loadAllRecipes}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Main content page rendering */}
      <div className="page-transition" key={activeNavigationTab}>
        {renderActiveView()}
      </div>

      {/* Modal: Manual Recipe Creation Form */}
      <RecipeManualInputFormModal
        isOpen={isRecipeFormModalOpen}
        onClose={() => setIsRecipeFormModalOpen(false)}
        onSave={handleSaveNewRecipe}
      />

      {/* Drawer Panel: Slide-in Recipe Details Inspector */}
      <RecipeDetailsSidePanel
        isOpen={isDetailPanelOpen}
        onClose={() => {
          setIsDetailPanelOpen(false);
          setSelectedRecipeDetail(null);
        }}
        recipe={selectedRecipeDetail}
        onDeleteRecipe={handleDeleteRecipe}
        onPlanMeal={handleAddMealToSlot}
      />
    </AppLayout>
  );
}

export default App;
