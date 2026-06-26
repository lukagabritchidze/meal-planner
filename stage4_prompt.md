# Prompt for Claude Opus 4.8 — Stage 4: Dashboard, Mobile UX Overhaul & Production Deployment (Neon + Render + Vercel)

---

## Context

You are helping build a **Recipe & Meal Planner** application branded **"Hearth"**. The architecture is:

- **Frontend:** React 19 (Vite SPA). Already has:
  - A responsive layout shell `<AppLayout>` (`src/components/AppLayout.jsx`) with a sticky left sidebar on desktop, a mobile top header, and a mobile bottom navigation bar. Nav tabs: Dashboard, Recipes, Meal Planner, Shopping List, Holidays.
  - A working Recipe Grid (`<RecipeGrid>` / `<RecipeCard>`), a manual Recipe Form modal, a slide-in `<RecipeDetailsSidePanel>`, a `<ServingScaler>`, a full `<ShoppingList>` / `<ShoppingGroup>` view, a `<HolidayManager>`, dark mode (`useDarkMode` + `<ThemeToggle>` + `src/styles/theme.css` design tokens), and an email/password auth flow (`<AuthView>`, persisted in `localStorage`).
  - An API service layer in `src/services/` (`recipeManagementApiService.js`, `authApiService.js`).
- **Backend:** Java 21 Spring Boot 3.3.0 REST API (Maven) using Spring Data JPA / Hibernate, with Spring Profiles:
  - `dev` → SQLite (`application-dev.properties`) — the default active profile.
  - `prod` → PostgreSQL via environment variables (`application-prod.properties`).
- **Existing backend structure:** controllers (`RecipeRestController`, `MealSchedulingPlanController`, `ShoppingListController`, `HolidayController`, `AuthRestController`), services, JPA entities (`Recipe`, `RecipeIngredient`, `RecipeInstructionStep`, `MealPlan`, `Holiday`, `HolidayMealPlan`, `User`, `ShoppingListCheckedState`), and config classes (`CorsConfiguration`, `InitialDataSeeder`, `ShoppingDepartmentConfiguration`).

**Stages 1, 2, and 3 are complete.** You are now implementing **Stage 4**: the central dashboard refinements, a focused mobile UX/usability overhaul, final visual polish, and full production deployment to **Neon PostgreSQL + Render (backend) + Vercel (frontend)**.

> Important: Several Stage 4 pieces already exist in skeleton form (e.g. `DashboardView.jsx` already renders metric cards and a "Today's plan" section). **Enhance and refine what exists — do not rebuild from scratch.** This is polish + deployment work, not a greenfield rewrite.

---

## Stage 4A — Backend: Dashboard Stats Service

Add a dedicated dashboard statistics endpoint so the frontend does not have to derive metrics client-side from large payloads.

**`DashboardController`** — expose:
- `GET /api/dashboard/stats?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` → returns a `DashboardStatsDto`:
  ```java
  public class DashboardStatsDto {
      private int totalRecipes;          // total saved recipes
      private int favoriteRecipes;       // count where isFavorited == true
      private int plannedMealsThisWeek;  // MealPlan rows in [startDate, endDate]
      private int distinctShoppingItems; // aggregated distinct ingredients for the week
      private NutritionEstimateDto weeklyNutrition; // simple estimated totals
      private List<RecipeSummaryDto> favoriteRecipeShortlist; // up to 6 favorites for quick access
  }
  ```
- `NutritionEstimateDto` holds rough weekly totals: `calories`, `proteinGrams`, `carbsGrams`, `fatGrams`. If the `Recipe` entity has no nutrition fields, compute a **transparent, clearly-labeled estimate** (e.g. a fixed per-serving heuristic) rather than inventing precise numbers. Document the heuristic in a Javadoc comment so it is obviously an estimate.

**`DashboardStatsService`** — a `@Service` that aggregates the above by reusing existing repositories (`RecipeRepository`, `MealPlanRepository`) and the existing `ShoppingListService` aggregation for the distinct-item count. Do not duplicate aggregation logic — call the existing service.

---

## Stage 4B — Frontend: Dashboard Polish

Refine the existing `<DashboardView>` (`src/components/DashboardView.jsx`):

- **Fetch real stats:** Add a `dashboardApiService` method (or extend the existing service) to call `GET /api/dashboard/stats` for the current week (reuse the week-range state from `App.jsx`). Replace the client-side `totalItemsToBuy` heuristic with the backend value.
- **Weekly nutrition chart:** Add a compact weekly nutrition visualization (calories + macro breakdown). Prefer a lightweight, dependency-free approach (CSS bar/donut built from divs, or inline SVG). Only add a charting library if there is a clear justification; if you do, keep it small and document why.
- **Quick-access favorites:** A horizontal row / responsive grid of favorite recipe cards from `favoriteRecipeShortlist`, each opening the recipe details panel on tap/click.
- **Skeleton loaders:** Replace spinners / blank states with grey skeleton placeholders that mimic the shape of the metric cards, the today's-plan cards, and the favorites row while data is loading. Use the existing `--color-skeleton-base` / `--color-skeleton-shimmer` tokens from `theme.css`.
- **Transitions & micro-interactions:** Add smooth page transitions when switching nav tabs and subtle hover/press micro-interactions (e.g. gentle scale/elevation on recipe cards). Keep all animations ≤ 200 ms and respect `prefers-reduced-motion`.

---

## Stage 4C — Extra Polish Feature: Shopping List Export

Add an export affordance to the `<ShoppingList>` view:

- A **"Copy as text"** button that compiles the current week's aggregated list into a clean, copy-pasteable plain-text block (grouped by department, one item per line with amount + unit), copied to the clipboard with a confirmation toast.
- A **"Print"** button that opens a browser-printable receipt layout (a print-only stylesheet or a dedicated print view) showing the list title, week range, and grouped items with checkboxes. Hide app chrome (sidebar, nav) in the print stylesheet.

---

## Added Task 1 — Mobile UX / Usability Overhaul

The desktop experience is already good. **The mobile (smartphone) experience must be made genuinely appealing and usable**, not just "not broken". Audit every view at real phone widths and fix the following:

**Global mobile requirements:**
- Test and verify layouts at **360px, 390px, and 768px** widths. Nothing should overflow horizontally or require pinch-zoom.
- All interactive elements must have a **minimum 44 × 44 px touch target** with adequate spacing so adjacent controls are not mis-tapped.
- Apply **safe-area insets** (`env(safe-area-inset-bottom)`, etc.) so the mobile bottom navigation bar and any fixed buttons clear notches/home indicators on modern phones.
- Use **responsive typography** (clamp-based or breakpoint-based) so desktop-sized headings (e.g. the `2.2rem` dashboard heading) scale down sensibly on small screens.
- Ensure content is never hidden behind the fixed mobile top header or bottom nav (correct top/bottom padding on `main-content`).

**Specific cleanups:**
- **`DashboardView.jsx` relies heavily on inline desktop-oriented styles.** Move layout-critical styling into CSS so it can adapt at breakpoints (metric cards stack cleanly, "Today's plan" cards become a comfortable single column, the header button is full-width or repositioned on mobile). Inline styles that don't respond to breakpoints are the main offender here.
- **Modals & side panels** (`RecipeManualInputFormModal`, `RecipeDetailsSidePanel`, `RecipePickerModal`, `HolidayFormModal`): on mobile they should present as full-screen or bottom-sheet style, scroll internally, keep their primary action button reachable above the keyboard, and not trap the page behind a non-scrolling overlay.
- **Forms:** inputs must use appropriate `inputmode`/`type` (numeric keypad for quantities, etc.), font-size ≥ 16px to prevent iOS auto-zoom, and visible focus states.
- **Meal Planner & Shopping List:** confirm the touch-friendly mobile variants flow well, checkboxes/tap zones are large, and week navigation is thumb-reachable.
- **Mobile bottom nav** currently renders all 5 tabs plus a theme toggle — verify the labels/icons don't crowd or wrap awkwardly at 360px; condense labels or adjust spacing if they do.

Deliver this as responsive CSS improvements + minimal component refactors. Do not regress the desktop layout.

---

## Added Task 2 — Production Deployment (Neon PostgreSQL + Render + Vercel)

Prepare and document a full production deployment. This requires concrete configuration changes in addition to the deployment steps.

### Backend configuration changes (Spring Boot → Render, DB → Neon)

1. **Port binding for Render:** Render injects a `PORT` env var. Add `server.port=${PORT:8080}` to `application.properties` (or the prod profile) so the app binds to Render's assigned port while still defaulting to 8080 locally.

2. **Neon PostgreSQL connection (prod profile):** The existing `application-prod.properties` already reads `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD` with the PostgreSQL driver and dialect, and `spring.jpa.hibernate.ddl-auto=update` (so Hibernate builds the tables on Neon automatically on first launch). Keep this. Document the **Neon JDBC URL format** clearly, including the required SSL parameter:
   ```
   SPRING_DATASOURCE_URL=jdbc:postgresql://<neon-host>/<database>?sslmode=require
   SPRING_DATASOURCE_USERNAME=<neon-user>
   SPRING_DATASOURCE_PASSWORD=<neon-password>
   ```
   Note that Neon requires SSL (`sslmode=require`). If the Neon endpoint needs the endpoint-id workaround, document `?sslmode=require&options=endpoint%3D<endpoint-id>`.

3. **Environment-variable-driven CORS:** `CorsConfiguration.java` currently hardcodes `allowedOriginPatterns("http://localhost:*")`, which will block the deployed Vercel frontend. Refactor it to read allowed origins from an env var:
   - Add a property `app.cors.allowed-origins` (bound via `@Value("${app.cors.allowed-origins:http://localhost:*}")` or a `@ConfigurationProperties` bean), populated in prod from `APP_CORS_ALLOWED_ORIGINS` (comma-separated list, e.g. the Vercel domain).
   - Keep `http://localhost:*` as the local default so dev is unaffected.
   - Preserve the existing methods/headers/credentials configuration.

4. **Render build & start:** Document both supported approaches; pick **native Maven** as the default unless a Dockerfile is preferred:
   - **Native (recommended):** Build command `./mvnw clean package -DskipTests` (ensure the Maven wrapper `mvnw`/`mvnw.cmd` + `.mvn/` are committed; if absent, generate them). Start command `java -Dspring.profiles.active=prod -jar target/backend-0.0.1-SNAPSHOT.jar` (or use `SPRING_PROFILES_ACTIVE=prod` env var instead of the `-D` flag).
   - **Docker (optional):** Provide a multi-stage `Dockerfile` (Maven build stage → slim JRE 21 runtime stage) if Docker deployment is chosen.
   - Set `SPRING_PROFILES_ACTIVE=prod` as a Render environment variable.

5. Optionally add a lightweight health endpoint (or note Spring Boot Actuator) for Render health checks.

### Frontend configuration changes (React/Vite → Vercel)

1. **Remove hardcoded API host:** Both `src/services/recipeManagementApiService.js` and `src/services/authApiService.js` hardcode `http://localhost:8080`. Refactor them to read a base URL from a Vite env var:
   ```js
   const API_ROOT = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
   ```
   Then build all endpoints from `API_ROOT` (note: `recipeManagementApiService.js` has several inline `http://localhost:8080/...` strings beyond the top-level constant — convert **all** of them).
2. Add a committed **`.env.example`** in `frontend/` documenting `VITE_API_BASE_URL`, and ensure local `.env`/`.env.local` are git-ignored.
3. Document **Vercel project settings**: Root Directory = `frontend`, Framework Preset = Vite, Build Command `npm run build`, Output Directory `dist`, and the `VITE_API_BASE_URL` environment variable set to the Render backend URL.
4. Add a `vercel.json` SPA rewrite (all routes → `/index.html`) if client-side routing requires it.

### Deployment sequence (document in the file as a runbook)

1. Create the Neon project + database; copy connection details.
2. Deploy backend to Render with the env vars above; confirm Hibernate creates tables on Neon and the service is reachable.
3. Deploy frontend to Vercel with `VITE_API_BASE_URL` = Render URL; note the assigned Vercel domain.
4. Add the Vercel domain to `APP_CORS_ALLOWED_ORIGINS` on Render and redeploy the backend.
5. Smoke test end-to-end (register/login, create recipe, plan a meal, generate shopping list) against production.

---

## What I Need From You (Credentials & Account Checklist)

These are required only at the actual deploy/verify step. Provide them (or confirm you will enter them directly in each provider's dashboard — do **not** commit secrets to git):

- **Neon (PostgreSQL):**
  - The JDBC connection URL in the form `jdbc:postgresql://<host>/<db>?sslmode=require`, plus username and password — OR the raw Neon connection string so it can be converted.
  - Confirmation of SSL mode (Neon requires `sslmode=require`).
- **Render (backend host):**
  - Confirm you have a Render account and will create a **Web Service** from this repo.
  - Choice of build approach: native Maven (default) or Docker.
  - You will provide the final **Render service URL** once the service is created (needed for the frontend env var).
  - I will set these Render env vars: `SPRING_PROFILES_ACTIVE=prod`, `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `APP_CORS_ALLOWED_ORIGINS`.
- **Vercel (frontend host):**
  - Confirm you have a Vercel account and that the project Root Directory is `frontend/`.
  - You will provide the final **Vercel domain** so it can be added to the backend CORS allow-list.
  - I will set `VITE_API_BASE_URL` = the Render backend URL.
- **Spoonacular (external recipe import):**
  - `SpoonacularRecipeIntegrationService` may require an API key in production. Confirm whether external recipe import should stay enabled in prod, and if so, provide the API key (it will be referenced via an env var, e.g. `SPOONACULAR_API_KEY`).
- **Secrets handling:**
  - Confirm you will enter all secrets directly in the Render/Vercel/Neon dashboards. Code will reference them only via environment variables, and `.env` files will be git-ignored.

---

## Deliverables Checklist for Professor Check-in (Stage 4)

- [ ] Dashboard shows real backend-computed stats (recipes, favorites, planned meals, shopping items) plus a weekly nutrition visualization and quick-access favorites.
- [ ] Skeleton loaders appear while data loads; smooth page transitions and card micro-interactions are present (and respect reduced-motion).
- [ ] Shopping list "Copy as text" and printable receipt both work.
- [ ] Full mobile walkthrough at phone widths (360/390px): no horizontal overflow, 44px touch targets, safe-area-aware bottom nav, modals usable with the on-screen keyboard.
- [ ] Backend deployed to Render with the `prod` profile, connected to Neon PostgreSQL (tables auto-created by Hibernate).
- [ ] Frontend deployed to Vercel, talking to the Render backend via `VITE_API_BASE_URL`, with CORS allowing the Vercel domain.
- [ ] End-to-end production smoke test (auth → recipe → planner → shopping list) passes on the live URLs, demonstrated on a mobile device or responsive simulator.

---

## Code Style & Quality Notes

- All new Java classes must include Javadoc on public methods.
- All new React components must be functional components with hooks (no class components).
- All API calls must go through the `src/services/` service layer — no raw `fetch` inside components.
- No hardcoded hex colors in new/edited CSS — use the `var(--color-*)` design tokens from `theme.css` (this keeps dark mode intact).
- No hardcoded `http://localhost:8080` anywhere — always go through `VITE_API_BASE_URL`.
- Never commit secrets; reference all credentials via environment variables and keep `.env` files git-ignored.
- Handle error states in every component with a user-friendly message (not a raw exception), following the existing patterns.
- Follow the naming conventions already established in the codebase. These changes are refinement + deployment, not a rewrite — preserve existing behavior.
