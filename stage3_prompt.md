# Prompt for Claude Opus 4.8 — Stage 3: Smart Shopping List, Measurement Conversion, Holiday Planner & Dark Mode

---

## Context

You are helping build a **Recipe & Meal Planner** application. The architecture is:

- **Frontend:** React (Vite SPA) — already has a responsive layout shell with a sticky left sidebar on desktop and a bottom navigation bar on mobile, plus a working Recipe Grid (`<RecipeGrid>` / `<RecipeCard>`), a Recipe Form modal, and an API fetching layer (in `src/api/`).
- **Backend:** Java Spring Boot REST API (Maven) using Spring Data JPA / Hibernate, with Spring Profiles for:
  - `dev` → SQLite (`application-dev.properties`)
  - `prod` → Aiven-managed PostgreSQL via environment variables (`application-prod.properties`)
- **Existing entities:** `Recipe` (with an `@OneToMany` list of `Ingredient`), `Ingredient` (fields: `name`, `amount` as `Double`, `unit` as `String`), `MealPlan` (fields: `recipeId`, `date` as `LocalDate`, `slot` as `String` — "Breakfast" / "Lunch" / "Dinner").

Stages 1 and 2 are complete. You are now implementing **Stage 3** plus three additional feature extensions described below.

---

## Stage 3 Core Tasks

### 3A — Backend: Aggregation Engine & Shopping List API

Implement the following in Spring Boot:

**`ShoppingListItem` DTO** (not a database entity, used only as a response object):
```java
public class ShoppingListItem {
    private Long ingredientId;
    private String name;
    private Double amount;
    private String unit;
    private String department; // "Produce", "Dairy", "Meat", "Pantry", "Other"
    private boolean checked;
}
```

**`ShoppingListService`** — a `@Service` class with this logic:
1. Fetch all `MealPlan` entries whose `date` falls within the given `startDate`–`endDate` range (inclusive).
2. For each `MealPlan`, load the associated `Recipe` and its `Ingredient` list.
3. **Before aggregating**, convert every ingredient's `(amount, unit)` pair to metric using the conversion rules in Section "Measurement Conversion Rules" below.
4. Aggregate duplicate ingredients by `name` (case-insensitive): sum their converted amounts.
5. After aggregation, apply the metric simplification rules (g → kg if ≥ 1000 g; ml → l if ≥ 1000 ml).
6. Assign each ingredient to a grocery `department` using a keyword lookup map (e.g., ingredients containing "milk", "cheese", "yogurt", "butter", "cream" → "Dairy"; "chicken", "beef", "pork", "fish", "shrimp", "salmon", "turkey" → "Meat"; "flour", "sugar", "oil", "vinegar", "salt", "pepper", "spice", "cumin", "paprika", "cinnamon", "pasta", "rice", "can", "canned", "broth", "stock", "baking" → "Pantry"; everything else → "Produce"). Make the map configurable as a `Map<String, List<String>>` bean so it can be extended without rewriting logic.
7. Return a `Map<String, List<ShoppingListItem>>` where keys are department names and values are the sorted ingredient lists.

**`ShoppingListController`** — expose:
- `GET /api/shopping-list?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` → returns the aggregated map described above.
- `PUT /api/shopping-list/item/{ingredientId}/toggle` → toggles the `checked` field on a `ShoppingListCheckedState` entity (create this small entity: fields `ingredientId Long`, `date LocalDate`, `checked Boolean`) so that check-state persists across page refreshes within the same week.
- `DELETE /api/shopping-list/checked?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` → clears all checked states for the given week (used by a "Reset List" button on the frontend).

---

### 3B — Backend: Serving Scaler Endpoint

Add one endpoint to `RecipeController`:

- `GET /api/recipes/{id}/scaled?servings={n}` → returns the recipe with all ingredient amounts scaled by the factor `n / recipe.defaultServings`. Apply metric conversion + simplification to the scaled amounts before returning. Return a full `RecipeDto` (same shape as the existing `GET /api/recipes/{id}` response but with scaled and converted ingredient amounts).

---

### 3C — Frontend: `<ServingScaler>` Component

On the recipe detail view, add a `<ServingScaler>` component:

- Renders a label "Servings:", a decrement button (`−`), a numeric display, and an increment button (`+`). Minimum value: 1.
- On every change, call `GET /api/recipes/{id}/scaled?servings={n}` and update the displayed ingredient list in real time.
- Show a subtle loading skeleton on the ingredient rows while the request is in flight (grey animated bar replacing the amount text).
- The scaler must work cleanly on both mobile (touch targets ≥ 44 × 44 px) and desktop.

---

### 3D — Frontend: `<ShoppingList>` & `<ShoppingGroup>` Components

Build a full Shopping List page/view:

**`<ShoppingList>`** (page-level component):
- Fetches `GET /api/shopping-list?startDate=...&endDate=...` for the currently selected week (reuse the week-selection state from the Meal Planner).
- Shows a week navigator (← Prev Week / Next Week →) at the top so users can browse past or future lists.
- Shows a "Reset List" button that calls `DELETE /api/shopping-list/checked` and refreshes.
- Groups items by department using `<ShoppingGroup>`.
- Shows an item count badge per group (e.g., "Produce (7)") and a progress indicator showing how many items in the group are checked.

**`<ShoppingGroup>`** (per-department component):
- Collapsible — clicking the group header toggles visibility of the item list.
- Each item renders: a large checkbox (≥ 44 × 44 px touch target), ingredient name in bold, and the metric amount + unit to the right.
- Checking/unchecking calls `PUT /api/shopping-list/item/{ingredientId}/toggle` optimistically (update UI immediately, roll back on error).
- Checked items get `text-decoration: line-through` and reduced opacity (0.45).
- Animate items in/out using a smooth CSS transition when toggling.

**Empty state:** If no meals are planned for the selected week, show a friendly illustration placeholder and a call-to-action: "No meals planned yet — head to the Planner to get started."

---

## Extended Feature 1 — Measurement Conversion to Metric

### Conversion Rules (implement as a standalone `MeasurementConverter` utility class/service in Spring Boot AND as a `measurementConverter.js` utility in React for the frontend scaled preview)

**Volume — always convert to millilitres first, then simplify:**

| Input unit (accept these variants) | Multiply by (→ ml) |
|---|---|
| tsp, teaspoon, teaspoons | 4.929 |
| tbsp, tablespoon, tablespoons | 14.787 |
| fl oz, fluid ounce, fluid ounces | 29.574 |
| cup, cups | 236.588 |
| pt, pint, pints | 473.176 |
| qt, quart, quarts | 946.353 |
| gal, gallon, gallons | 3785.41 |
| l, liter, litre, liters, litres | 1000 |
| ml, milliliter, millilitre, milliliters, millilitres | 1 (no conversion) |

After converting to ml: if result ≥ 1000, display as **litres** (rounded to 2 decimal places); otherwise display as **millilitres** (rounded to 0 decimal places).

**Mass — always convert to grams first, then simplify:**

| Input unit (accept these variants) | Multiply by (→ g) |
|---|---|
| oz, ounce, ounces | 28.3495 |
| lb, lbs, pound, pounds | 453.592 |
| kg, kilogram, kilograms | 1000 |
| g, gram, grams | 1 (no conversion) |

After converting to g: if result ≥ 1000, display as **kilograms** (rounded to 2 decimal places); otherwise display as **grams** (rounded to 0 decimal places).

**Unrecognized / count-based units** (e.g., "cloves", "slices", "pieces", "whole", "pinch", "dash", or any unit not in the tables above): **leave amount and unit unchanged**. Do not attempt to convert them.

**Implementation notes:**
- In Java, the `MeasurementConverter` should expose: `ConvertedMeasurement convert(Double amount, String unit)` returning a record/DTO with `Double convertedAmount` and `String convertedUnit`.
- In JavaScript (`src/utils/measurementConverter.js`), export: `convertToMetric(amount, unit)` → `{ amount: Number, unit: String }`.
- Both implementations must be covered by unit tests:
  - Java: JUnit 5 tests in `MeasurementConverterTest.java` covering at least: cups→ml, lbs→g, oz→g, gallon→l, teaspoon→ml, already-metric passthrough, unrecognized unit passthrough, boundary cases (exactly 1000 ml → l, exactly 1000 g → kg).
  - JavaScript: Jest tests in `measurementConverter.test.js` covering the same scenarios.

---

## Extended Feature 2 — Holiday Meal Planner

### What it does
Users can define named holidays (e.g., "Birthday", "Christmas Dinner", "Eid al-Fitr"), assign them a date, and then plan specific meals for that day independently of the regular weekly planner. Holiday days are highlighted in the planner calendar view.

### Backend Tasks

**New Entity: `Holiday`**
```java
@Entity
@Table(name = "holidays")
public class Holiday {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // e.g. "Birthday", "Christmas Dinner"

    @Column(nullable = false)
    private LocalDate date;

    @Column
    private String emoji; // optional, e.g. "🎂", "🎄", "🌙"

    @Column
    private String color; // optional hex string, e.g. "#FF6B6B", for calendar highlight
}
```

**New Entity: `HolidayMealPlan`**
```java
@Entity
@Table(name = "holiday_meal_plans")
public class HolidayMealPlan {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "holiday_id", nullable = false)
    private Holiday holiday;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    @Column(nullable = false)
    private String slot; // "Breakfast", "Lunch", "Dinner", "Snack", "Dessert"

    @Column
    private Integer servings; // optional override, defaults to recipe.defaultServings
}
```

**`HolidayController`** — expose:
- `GET /api/holidays` → returns all holidays sorted by date ascending.
- `GET /api/holidays/{id}` → returns a single holiday with its meal plan (list of `HolidayMealPlan` with nested recipe info).
- `POST /api/holidays` → creates a new holiday. Request body: `{ name, date, emoji, color }`.
- `PUT /api/holidays/{id}` → updates name, date, emoji, or color.
- `DELETE /api/holidays/{id}` → deletes a holiday and cascades to delete all its `HolidayMealPlan` rows.
- `POST /api/holidays/{id}/meals` → assigns a recipe to a holiday slot. Body: `{ recipeId, slot, servings }`.
- `DELETE /api/holidays/{holidayId}/meals/{mealId}` → removes a single meal from a holiday.
- `GET /api/holidays/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` → returns all holidays whose date falls in range (used to highlight them in the weekly planner calendar).

### Frontend Tasks

**`<HolidayManager>` page** — accessible from the sidebar/bottom nav via a 🎉 icon:

Layout:
1. **Header** with title "My Holidays" and an "Add Holiday" button.
2. **Holiday list** — each row shows: emoji, holiday name, formatted date, a colored dot (using the holiday's `color`), an "Edit" icon button, and a "Delete" icon button (with a confirmation dialog before deleting).
3. Clicking a holiday name or a "Plan Meals" button opens the `<HolidayDetailView>`.

**`<HolidayFormModal>`** — for creating or editing a holiday:
- Fields: Holiday Name (text input, required), Date (date picker, required), Emoji picker (a grid of 12–16 common celebration emojis: 🎂🎄🎃🎆🎇🌙⭐🥂🎊🎁🏖️🎓🕌🕍⛪🛕), Color picker (a palette of 8 preset hex colors to choose from, displayed as colored circles).
- On submit: calls `POST /api/holidays` (create) or `PUT /api/holidays/{id}` (edit).

**`<HolidayDetailView>`** — shown when a holiday is selected:
- Displays the holiday name, emoji, and date prominently at the top.
- Shows a 5-slot grid: Breakfast, Lunch, Dinner, Snack, Dessert.
- Each slot shows: the assigned recipe card (name + image placeholder + servings) if assigned, or a "+ Add" card if empty.
- Clicking "+ Add" opens `<RecipePickerModal>` (reuse from Stage 2) with an additional "Servings" input.
- Assigned recipe cards have a trash icon to remove that meal.
- A "Generate Shopping List" button at the bottom collects all recipe ingredients from the holiday's meals, converts them to metric, aggregates, and displays them in a modal using the same `<ShoppingList>` UI — but scoped to this single holiday rather than a date range.

**Calendar integration** — in the existing weekly planner view:
- Call `GET /api/holidays/range?startDate=...&endDate=...` whenever the week changes.
- If a day column (desktop) or day tab (mobile) falls on a holiday date, highlight it with the holiday's color as a subtle background tint and show the emoji + name below the day label.
- Clicking the holiday chip opens a small popover/tooltip with a "View Holiday Plan" link that navigates to `<HolidayDetailView>`.

---

## Extended Feature 3 — Dark Mode

### Implementation Approach

Use **CSS custom properties (variables)** for the entire color system. Do not use a CSS framework's built-in dark mode — define it yourself so it integrates cleanly with the existing design.

**In `src/styles/theme.css`** (create this file and import it at the top of `main.jsx`):

```css
:root {
  /* Light mode tokens */
  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #F8F7F4;
  --color-bg-card: #FFFFFF;
  --color-bg-sidebar: #F3F2EF;
  --color-bg-modal: #FFFFFF;
  --color-bg-input: #FFFFFF;
  --color-bg-hover: #F0EFE9;

  --color-text-primary: #1A1A1A;
  --color-text-secondary: #6B6B6B;
  --color-text-muted: #A0A0A0;
  --color-text-inverse: #FFFFFF;

  --color-border: #E5E4DF;
  --color-border-focus: #4A7C59;

  --color-accent-primary: #4A7C59;   /* herb green — the app's signature color */
  --color-accent-hover: #3A6347;
  --color-accent-light: #EAF2EC;

  --color-danger: #D94F3D;
  --color-danger-light: #FDF0EE;
  --color-warning: #E09B3D;
  --color-success: #4A7C59;

  --color-skeleton-base: #E8E7E3;
  --color-skeleton-shimmer: #F5F4F0;

  --color-checked-text: rgba(26,26,26,0.4);

  --shadow-card: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05);
  --shadow-modal: 0 20px 60px rgba(0,0,0,0.15);
  --shadow-sidebar: 2px 0 8px rgba(0,0,0,0.05);
}

[data-theme="dark"] {
  --color-bg-primary: #111211;
  --color-bg-secondary: #1A1C1A;
  --color-bg-card: #1F211F;
  --color-bg-sidebar: #161816;
  --color-bg-modal: #1F211F;
  --color-bg-input: #252725;
  --color-bg-hover: #2A2D2A;

  --color-text-primary: #E8EBE8;
  --color-text-secondary: #9EA89E;
  --color-text-muted: #656D65;
  --color-text-inverse: #111211;

  --color-border: #2E322E;
  --color-border-focus: #6BAF7E;

  --color-accent-primary: #6BAF7E;   /* lighter green for dark mode legibility */
  --color-accent-hover: #5A9A6C;
  --color-accent-light: #1A2E1E;

  --color-danger: #E8675A;
  --color-danger-light: #2A1A18;
  --color-warning: #E8B45A;
  --color-success: #6BAF7E;

  --color-skeleton-base: #252725;
  --color-skeleton-shimmer: #2E322E;

  --color-checked-text: rgba(232,235,232,0.35);

  --shadow-card: 0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
  --shadow-modal: 0 20px 60px rgba(0,0,0,0.5);
  --shadow-sidebar: 2px 0 8px rgba(0,0,0,0.3);
}
```

**`useDarkMode` hook** (`src/hooks/useDarkMode.js`):
```javascript
// Responsibilities:
// 1. Read initial preference from localStorage key "theme" (values: "light" | "dark" | "system").
// 2. If "system" or no preference, use window.matchMedia('(prefers-color-scheme: dark)') and listen for changes.
// 3. Apply [data-theme="dark"] or [data-theme="light"] to document.documentElement.
// 4. Expose: { theme, setTheme } where theme is "light" | "dark" | "system".
```

**`<ThemeToggle>` component**:
- A single icon button with three states cycling on click: Light (☀️) → Dark (🌙) → System (💻) → back to Light.
- Place it in:
  - **Desktop sidebar:** pinned at the bottom of the sidebar, above any "Settings" link.
  - **Mobile bottom nav:** add it as a fourth icon tab.
- Tooltip on hover showing the current mode name.
- The icon should animate on toggle (smooth rotation or crossfade, ≤ 200 ms).
- The toggle must save preference to `localStorage` so it persists across sessions.

**Dark mode requirements for existing components:**
- Every existing component must use only `var(--color-*)` tokens — no hardcoded hex values anywhere in the codebase. Audit and update all existing `.css` and inline style objects.
- Recipe cards: in dark mode, use `var(--color-bg-card)` background, `var(--color-border)` for card borders, and ensure image placeholder backgrounds also use tokens.
- Modals: backdrop should be `rgba(0,0,0,0.6)` in light mode and `rgba(0,0,0,0.8)` in dark mode — use a CSS variable `--color-backdrop`.
- Skeleton loaders: use `--color-skeleton-base` and `--color-skeleton-shimmer` for the shimmer animation.
- Form inputs: `background: var(--color-bg-input)`, `color: var(--color-text-primary)`, `border-color: var(--color-border)`, `outline-color: var(--color-border-focus)` on focus.
- Transition: add `transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease` to the `body` and all card/panel elements so the theme switch is smooth.

---

## Deliverables Checklist for Professor Check-in (Stage 3 + Extensions)

- [ ] Demonstration of adding multiple recipes with overlapping ingredients (some measured in cups, ounces, pounds) and showing the shopping list with all quantities converted to metric (ml/l and g/kg).
- [ ] Show aggregation working correctly (e.g., two recipes each calling for "1 cup milk" → shown as "473 ml milk" or if total ≥ 1000 ml → shown as "X.XX l milk").
- [ ] Show the Serving Scaler live-updating ingredient amounts on the recipe detail page.
- [ ] Create a holiday ("Birthday 🎂"), pick a date, assign meals to Breakfast/Lunch/Dinner/Dessert slots, then generate the holiday-scoped shopping list.
- [ ] Show the holiday highlighted in the weekly planner calendar.
- [ ] Toggle between Light, Dark, and System modes. Show that the preference persists on page reload.
- [ ] Show the app in dark mode on a simulated mobile view, demonstrating the shopping list with all mobile-sized touch targets.

---

## Carry-Over Fix from Stage 2: Component Modularization

The following components were left inline inside `MealPlannerView.jsx` during Stage 2 and must be extracted into separate files before beginning any Stage 3 work:

- **`<DesktopPlanner>`** → move to `src/components/planner/DesktopPlanner.jsx`
- **`<MobilePlanner>`** → move to `src/components/planner/MobilePlanner.jsx`
- **`<RecipePickerModal>`** → move to `src/components/planner/RecipePickerModal.jsx`

Each extracted component must:
1. Receive all required data and callbacks via props — no direct state access from `MealPlannerView.jsx` internals.
2. Have its own co-located CSS module file (e.g., `DesktopPlanner.module.css`) if it currently uses any inline styles or shared class names that could conflict.
3. Be imported back into `MealPlannerView.jsx` cleanly so existing behaviour is fully preserved — this is a refactor, not a rewrite.

Do not proceed with any Stage 3 task until this extraction is complete and the planner view still works correctly.

---

## Code Style & Quality Notes

- All new Java classes must include Javadoc on public methods.
- All new React components must use functional components with hooks (no class components).
- All API calls go through the existing `src/api/` service layer — do not make raw `fetch` calls inside components.
- Error states must be handled in every component: show a user-friendly error message (not a raw exception) if any API call fails.
- All currency/unit formatting must go through the utility functions — never format units inline inside JSX.
- Follow the existing naming conventions already in the codebase.
