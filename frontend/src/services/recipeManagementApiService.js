/**
 * Service layer for communicating with the Spring Boot REST API for Recipes.
 */
const API_ROOT = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
const API_BASE_URL = `${API_ROOT}/api/recipes`;

export const recipeManagementApiService = {
  async fetchAllRecipes(categoryFilter = null) {
    let url = API_BASE_URL;
    if (categoryFilter && categoryFilter.trim() !== '' && categoryFilter !== 'All') {
      url += `?category=${encodeURIComponent(categoryFilter)}`;
    }
    const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`Failed to fetch recipes: ${response.status}`);
    return await response.json();
  },

  async fetchRecipeDetailsById(recipeId) {
    const response = await fetch(`${API_BASE_URL}/${recipeId}`, { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`Failed to fetch recipe details: ${response.status}`);
    return await response.json();
  },

  async fetchScaledRecipeDetailsById(recipeId, servings) {
    const response = await fetch(`${API_BASE_URL}/${recipeId}/scaled?servings=${encodeURIComponent(servings)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`Failed to fetch scaled recipe details: ${response.status}`);
    return await response.json();
  },

  async createNewManualRecipe(recipePayload) {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(recipePayload)
    });
    if (!response.ok) throw new Error(`Failed to create recipe: ${response.status}`);
    return await response.json();
  },

  async deleteRecipeById(recipeId) {
    const response = await fetch(`${API_BASE_URL}/${recipeId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`Failed to delete recipe: ${response.status}`);
    return true;
  },

  async toggleRecipeFavoriteStatus(recipeId) {
    const response = await fetch(`${API_BASE_URL}/${recipeId}/toggle-favorite`, {
      method: 'PUT',
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`Failed to toggle favorite: ${response.status}`);
    return await response.json();
  },

  async searchRecipes(query = '', category = 'All') {
    let url = `${API_BASE_URL}/search?query=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`;
    const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`Failed to search recipes: ${response.status}`);
    return await response.json();
  },

  async searchRecipesByIngredients(ingredientsList) {
    const ingredientsParam = ingredientsList.map(ing => ing.trim()).filter(Boolean).join(',');
    const url = `${API_BASE_URL}/search/ingredients?ingredients=${encodeURIComponent(ingredientsParam)}`;
    const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`Failed to search by ingredients: ${response.status}`);
    return await response.json();
  },

  async searchRecipesByHoliday(holidayName) {
    const url = `${API_BASE_URL}/search/holiday?holidayName=${encodeURIComponent(holidayName)}`;
    const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`Failed to search by holiday: ${response.status}`);
    return await response.json();
  },

  async fetchMealPlans(startDate, endDate) {
    const url = `${API_ROOT}/api/meal-plans?startDate=${startDate}&endDate=${endDate}`;
    const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`Failed to fetch meal plans: ${response.status}`);
    return await response.json();
  },

  async addMealPlan(payload) {
    const url = `${API_ROOT}/api/meal-plans`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`Failed to schedule meal: ${response.status}`);
    return await response.json();
  },

  async deleteMealPlan(mealPlanId) {
    const url = `${API_ROOT}/api/meal-plans/${mealPlanId}`;
    const response = await fetch(url, { method: 'DELETE' });
    if (!response.ok) throw new Error(`Failed to delete meal plan: ${response.status}`);
    return true;
  },

  async fetchShoppingList(startDate, endDate) {
    const url = `${API_ROOT}/api/shopping-list?startDate=${startDate}&endDate=${endDate}`;
    const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`Failed to fetch shopping list: ${response.status}`);
    return await response.json();
  },

  async toggleShoppingListItem(ingredientId, date) {
    const url = `${API_ROOT}/api/shopping-list/item/${ingredientId}/toggle?date=${date}`;
    const response = await fetch(url, { method: 'PUT', headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`Failed to toggle shopping list item: ${response.status}`);
    return await response.json();
  },

  async clearCheckedShoppingListItems(startDate, endDate) {
    const url = `${API_ROOT}/api/shopping-list/checked?startDate=${startDate}&endDate=${endDate}`;
    const response = await fetch(url, { method: 'DELETE' });
    if (!response.ok) throw new Error(`Failed to clear shopping list checks: ${response.status}`);
    return true;
  },

  async fetchHolidays() {
    const response = await fetch(`${API_ROOT}/api/holidays`, { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`Failed to fetch holidays: ${response.status}`);
    return await response.json();
  },

  async fetchHolidayById(holidayId) {
    const response = await fetch(`${API_ROOT}/api/holidays/${holidayId}`, { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`Failed to fetch holiday: ${response.status}`);
    return await response.json();
  },

  async createHoliday(payload) {
    const response = await fetch(`${API_ROOT}/api/holidays`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`Failed to create holiday: ${response.status}`);
    return await response.json();
  },

  async updateHoliday(holidayId, payload) {
    const response = await fetch(`${API_ROOT}/api/holidays/${holidayId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`Failed to update holiday: ${response.status}`);
    return await response.json();
  },

  async deleteHoliday(holidayId) {
    const response = await fetch(`${API_ROOT}/api/holidays/${holidayId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`Failed to delete holiday: ${response.status}`);
    return true;
  },

  async addHolidayMeal(holidayId, payload) {
    const response = await fetch(`${API_ROOT}/api/holidays/${holidayId}/meals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`Failed to add holiday meal: ${response.status}`);
    return await response.json();
  },

  async deleteHolidayMeal(holidayId, mealId) {
    const response = await fetch(`${API_ROOT}/api/holidays/${holidayId}/meals/${mealId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`Failed to delete holiday meal: ${response.status}`);
    return true;
  },

  async fetchHolidaysInRange(startDate, endDate) {
    const response = await fetch(`${API_ROOT}/api/holidays/range?startDate=${startDate}&endDate=${endDate}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`Failed to fetch holidays in range: ${response.status}`);
    return await response.json();
  },

  async fetchHolidayShoppingList(holidayId) {
    const response = await fetch(`${API_ROOT}/api/holidays/${holidayId}/shopping-list`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`Failed to fetch holiday shopping list: ${response.status}`);
    return await response.json();
  }
};
