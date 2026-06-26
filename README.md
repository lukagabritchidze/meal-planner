# PlateWise — Project Description & Workflow

**Live app:** [https://meal-planner-phi-six.vercel.app/](https://meal-planner-phi-six.vercel.app/)

---

## Overview

PlateWise is a full-stack Meal Planner and Recipe Management app. Users can organize weekly meals, save and browse recipes, and automatically generate a grocery shopping list from whatever they've scheduled. It works on both desktop and mobile.

Users create personal accounts, search for recipes by keyword, ingredient, or holiday theme, schedule meals into daily Breakfast/Lunch/Dinner slots, and get basic nutrition estimates for the week.

---

## System Architecture

PlateWise uses a decoupled frontend/backend setup.

### Frontend
- **Framework:** React (via Vite)
- **Styling:** Vanilla CSS (`index.css`) with CSS variables for light/dark theming and responsive layouts
- **State:** React Hooks — no heavy routing libraries needed
- **Service Layer:** `recipeManagementApiService.js` handles all HTTP requests to the backend, including user-scoped auth headers and cache-busting

### Backend
- **Framework:** Spring Boot (Java)
- **Data Access:** Spring Data JPA (Hibernate)
- **Database:** PostgreSQL (Neon) in production; SQLite locally
- **Auth:** Custom password hashing (`PasswordHasher.java`) with stateless `X-User-Id` request headers
- **REST APIs:** Controllers split by concern — Auth, Recipes, Meal Plans, Shopping Lists, Dashboard, Holidays

---

## Core Features

### 1. User Authentication
Register and log in with real-time validation (password matching, email format checks). All data — meal plans, shopping lists, favorites — is scoped per user account.

### 2. Recipe Management

**Browse & Search:** Filter by category (All, Breakfast, Lunch, Dinner, Vegetarian), search by keyword, use the "Fridge Ingredients Search" to find recipes based on what you have, or browse the "Holiday Menus" filter for themed events.

**Recipe Cards:** Each card shows a thumbnail, prep time, difficulty, and a favorite toggle.

**Recipe Detail Panel:** Includes full cook time, category, step-by-step instructions, and an "Add to meal plan" button that drops the recipe directly into the weekly planner.

**Serving Scaler:** Hit `+` or `−` to adjust ingredient quantities for any serving size. Amounts and units update automatically.

**Favorites:** Toggle any recipe as a favorite to pin it to the dashboard.

**Custom Recipes:** Add your own via a modal — give it a title, category, cook time, and as many ingredient rows and steps as you need.

### 3. Meal Planner
A weekly grid with Breakfast, Lunch, and Dinner slots for each day. Navigate between weeks, add recipes to any slot, and remove them just as easily.

### 4. Shopping List
Auto-generates from all meals scheduled in a given week. Ingredients are grouped by category (Produce, Pantry, etc.) and duplicates are consolidated. Check items off as you shop, reset the list, copy it as plain text, or print it.

### 5. Holiday Management
Create custom holidays (Thanksgiving, Christmas, etc.) and associate specific meal plans or recipes with them. Recipes can then be filtered by holiday theme from the browse view.

### 6. Dashboard
Shows a personalized greeting, summary stats (total recipes saved, favorites, planned meals, items left to buy), and a weekly nutrition breakdown (kcal, protein, carbs, fat) based on what's currently scheduled.

---

## Developer Workflow

### Local Setup

**Backend:**
```bash
cd backend
mvn spring-boot:run
# Starts on port 8080 with an in-memory SQLite database seeded by InitialDataSeeder.java
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Starts on port 5173
```

### Code Organization

- **Frontend components:** `frontend/src/components/` — organized by feature (`shopping/`, `planner/`, `holiday/`)
- **Backend:** `backend/src/main/java/com/mealplanner/` — split into `controller`, `service`, `repository`, `entity`, and `dto` packages

### API Communication

All frontend requests go through `recipeManagementApiService.js` or `authApiService.js`. Any user-specific request must call `userScopedHeaders()`, which attaches the `X-User-Id` header plus `Cache-Control` headers to prevent stale data showing up across different user sessions.

### Deployment

- **Frontend:** Vercel — auto-deploys on push to `main`
- **Backend:** Render, connected to Neon PostgreSQL. The `prod` Spring profile handles the database connection string.

---

## UI/UX

Desktop gets a fixed sidebar; mobile gets a sliding hamburger drawer. Full light/dark mode via a toggle. The design uses soft shadows, rounded corners, and glassmorphism overlays on modals and panels.
