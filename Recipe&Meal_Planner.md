# Recipe & Meal Planner — Implementation Plan

This document outlines a 4-stage development plan for the Recipe & Meal Planner application. The architecture consists of a decoupled React frontend (Vite) and a Spring Boot REST API (Maven) backed by a relational database system optimized for free-tier hosting using Aiven.

### Production Architecture
*   **Frontend:** React (Single Page Application, Vite) hosted on Vercel.
*   **Backend:** Java Spring Boot (REST API) hosted on Render.
*   **Database (Hybrid Approach):** 
    *   **Development:** SQLite (`application-dev.properties` for fast, zero-configuration local development).
    *   **Production:** Managed PostgreSQL on Neon (`application-prod.properties` using permanent free tier, ensuring data is preserved).
*   **Data Access:** Spring Data JPA / Hibernate (translates the same Java code to both SQLite and PostgreSQL automatically).

---

## Stage 1: API Foundations & Hybrid Database Setup
**Objective:** Set up the decoupled architecture, configure Spring Boot profiles for SQLite (dev) and PostgreSQL (prod), and build a responsive, mobile-friendly Recipe Manager with CRUD capabilities.

### 1. Backend Tasks (Spring Boot)
*   **Project Initialization:** Create a Spring Boot project via Maven with dependencies: Spring Web, Spring Data JPA, SQLite JDBC, and the PostgreSQL Driver.
*   **Spring Profiles Configuration:**
    *   Create `application-dev.properties` to connect to a local SQLite database file (`jdbc:sqlite:recipes.db`).
    *   Create `application-prod.properties` configured for PostgreSQL. Use environment variables (e.g., `${JDBC_DATABASE_URL}`) to safely receive connection credentials from Render without hardcoding Aiven credentials.
*   **Database Schema & JPA Models:** 
    *   Create Java entity models for `Recipe` and `Ingredient` using standard JPA annotations (`@Entity`, `@Table`, `@Id`, `@OneToMany`).
*   **REST Controllers:** Implement endpoints for:
    *   `GET /api/recipes` -> Returns a list of all recipes.
    *   `GET /api/recipes/{id}` -> Returns a single recipe detail.
    *   `POST /api/recipes` -> Saves a new manual recipe and its ingredients.
    *   `DELETE /api/recipes/{id}` -> Deletes a recipe.
*   **CORS Configuration:** Allow incoming requests from the React port (e.g., `localhost:5173`).

### 2. Frontend Tasks (React)
*   **Vite + React Setup:** Initialize the React application. Configure responsive CSS layouts.
*   **Responsive Layout Shell:** Build an adaptive `<AppLayout>` component:
    *   **Desktop:** Clean, sticky left sidebar for navigation.
    *   **Mobile:** Bottom navigation bar containing icons for easy thumb access.
*   **Recipe Grid:** Create `<RecipeGrid>` and `<RecipeCard>` components. 
    *   Use CSS Grid to make cards responsive (1 column on mobile, 2 on tablet, 3 or 4 on desktop).
*   **Recipe Form Component:** Create a mobile-optimized modal form to manually input new recipes (fields: Title, Category, Cook Time, Ingredients, Steps).
*   **API Fetching Layer:** Implement simple fetch utility functions in a dedicated API service file to communicate with Spring Boot endpoints.

### 3. Deliverables for Professor Check-in
*   A running backend using the `dev` profile with a local SQLite database file.
*   A fully responsive frontend shell showing the Recipes grid.
*   Demonstration of adding a recipe on a simulated mobile view and seeing it dynamically display in the UI.

---

## Stage 2: Responsive Meal Planner & Touch-Friendly Scheduling
**Objective:** Implement the meal planner engine. This stage focuses heavily on adaptive UI layouts, transitioning from a desktop grid to a mobile list.

### 1. Backend Tasks (Spring Boot)
*   **Planner Model:** Create a `MealPlan` entity. It links a `recipe_id` to a specific date and slot (e.g., "Breakfast", "Lunch", "Dinner").
*   **REST Controllers:** Implement endpoints for:
    *   `GET /api/meal-plans?startDate={date}&endDate={date}` (returns plans for a given week)
    *   `POST /api/meal-plans` (assigns a recipe to a date/slot)
    *   `DELETE /api/meal-plans/{id}` (removes a meal from the plan)

### 2. Frontend Tasks (React State & Interactions)
*   **State Management:** Create a central state in React to track the currently selected week (derived from a starting date).
*   **Adaptive Planner Components:**
    *   `<DesktopPlanner>`: A 7-day columns × 3-row (Breakfast, Lunch, Dinner) grid. Supports drag-and-drop to move mini recipe cards into slots.
    *   `<MobilePlanner>`: A day-scrolling header showing abbreviated days (M, T, W...). Tapping a day displays 3 large vertical cards (Breakfast, Lunch, Dinner) underneath it.
*   **Recipe Picker Modal:** Create a responsive modal `<RecipePickerModal>` that triggers when tapping/clicking an empty slot. It lets users search and select a recipe to assign to that slot.
*   **Alternative Scheduling Option:** Add a "Plan This Meal" button directly on the recipe details card, opening a modal to select a day and slot without needing to visit the planner page first. This serves as the primary touch-friendly method for mobile users.

### 3. Deliverables for Professor Check-in
*   Demonstration of scheduling a meal on a desktop screen using drag-and-drop.
*   Demonstration of resizing the browser window to mobile width, showing how the layout seamlessly adapts to the single-day view, and assigning a meal using the touch-friendly "Plan This Meal" selector.

---

## Stage 3: Dynamic Ingredient Scaling & Smart Shopping List
**Objective:** Write the data processing logic to combine planned meal ingredients, scale quantities, and present a structured checkout list.

### 1. Backend Tasks (Spring Boot)
*   **Aggregation Engine:** Create a backend service that:
    *   Retrieves all scheduled recipes for the active week.
    *   Aggregates duplicate ingredients (e.g., merging "2 cloves garlic" and "3 cloves garlic" into "5 cloves garlic").
    *   Groups ingredients by predefined grocery departments (Produce, Dairy, Meat, Pantry).
*   **REST Controllers:** Implement endpoints:
    *   `GET /api/shopping-list?startDate={date}&endDate={date}` (returns aggregated ingredients)
    *   `PUT /api/shopping-list/item/{id}/toggle` (tracks checked status of individual ingredients)

### 2. Frontend Tasks (React UI & Local State)
*   **Serving Scaler Component:** On the recipe detail view, implement a `<ServingScaler>` component. Adjusting the quantity state in React must scale the shown ingredient amounts instantly.
*   **Shopping List View:** Build `<ShoppingList>` and `<ShoppingGroup>` components.
    *   List items must display clean checkboxes, ingredient names, and combined amounts.
    *   Checking an item triggers a local UI state update (strikethrough text with reduced opacity) while making an asynchronous call to update the backend database.
*   **Mobile Optimizations:** Ensure the checkboxes are large enough (minimum 44x44 pixels touch target) to satisfy mobile usability standards.

### 3. Deliverables for Professor Check-in
*   Demonstration of adding multiple recipes with similar ingredients to the planner.
*   Demonstration of the dynamically generated, categorized shopping list.
*   Show physical interaction on a mobile view, checking off items as if walking through a grocery store.

---

## Stage 4: Dashboard, Polishing & Neon PostgreSQL Deployment
**Objective:** Implement the central dashboard, complete visual refinements, and deploy the backend to Render, pointing it directly to the Neon PostgreSQL database.

### 1. Backend Tasks (Spring Boot)
*   **Dashboard Stats Service:** Write a service to retrieve metadata for the current week:
    *   Total number of planned meals, favorite recipes, or nutrient estimates.
*   **Render & Aiven Integration:** 
    *   Deploy the Spring Boot application on Render.
    *   Set the active profile to `prod` via environment variables (`SPRING_PROFILES_ACTIVE=prod`).
    *   Provide the Neon PostgreSQL database credentials to Render as secure environment variables so Hibernate can build the tables on Neon automatically upon launch.

### 2. Frontend Tasks (React Visual Polish)
*   **Dashboard Layout:** Build the `<Dashboard>` landing page with mini versions of the current day's plan, weekly nutrition charts, and quick-access favorite recipe cards.
*   **Transitions & Animations:** Implement smooth CSS or React-based transitions when switching pages via the navigation bar. Add micro-interactions (such as subtle scaling when hovering over recipe cards).
*   **Skeleton Loaders:** Replace standard loading indicators with modern grey skeletons that mimic the shape of recipe cards while data is being fetched from the Spring Boot API.
*   **Extra Polish Feature:** Add a text export component that compiles the shopping list into a clean, copy-pasteable text block or generates a basic browser-printable receipt layout.

### 3. Deliverables for Professor Check-in
*   A fully polished, end-to-end walkthrough of the completed web application.
*   Demonstration of navigating the app on a mobile device or responsive simulator, highlighting performance, visual appeal, and usability.