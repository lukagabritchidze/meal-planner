/**
 * Hearth Dashboard page giving the chef a welcoming summary,
 * metrics overview, and today's scheduled meals.
 */
export const DashboardView = ({ 
  recipeListPayload, 
  plannedMeals, 
  setActiveNavigationTab 
}) => {
  // Determine current formatted date: e.g. "Thursday, June 4"
  const formattedToday = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  // Counts
  const totalRecipes = recipeListPayload.length;
  const totalPlannedMeals = Object.values(plannedMeals).filter(Boolean).length;

  const plannedRecipes = Object.values(plannedMeals).filter(Boolean);
  const totalItemsToBuy = (() => {
    if (plannedRecipes.length === 0) {
      return 14;
    }

    const aggregatedKeys = new Set();
    plannedRecipes.forEach((recipe) => {
      if (recipe.recipeIngredients) {
        recipe.recipeIngredients.forEach((ing) => {
          if (ing.ingredientName) {
            const key = `${ing.ingredientName.trim().toLowerCase()}-${(ing.ingredientQuantityUnit || '').trim().toLowerCase()}`;
            aggregatedKeys.add(key);
          }
        });
      }
    });
    return aggregatedKeys.size;
  })();

  // Retrieve today's meals using YYYY-MM-DD format
  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDateString = formatDateString(new Date());
  const mealSlots = ['Breakfast', 'Lunch', 'Dinner'];
  const todaysPlannedMeals = mealSlots.map(slot => {
    const key = `${todayDateString}-${slot}`;
    return {
      slot,
      recipe: plannedMeals[key] || null
    };
  });

  return (
    <section style={{ maxWidth: '950px', margin: '0 auto' }}>
      
      {/* 1. WELCOME HEADER BLOCK */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: '700' }}>
            {formattedToday}
          </span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.25rem', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
            Good day, chef.
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.15rem' }}>
            Here's what's cooking this week.
          </p>
        </div>
        
        <button 
          className="btn btn-primary" 
          onClick={() => setActiveNavigationTab('recipes')}
          style={{ 
            borderRadius: '9999px', 
            padding: '0.65rem 1.5rem', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px',
            backgroundColor: 'var(--primary)',
            color: 'var(--color-text-inverse)',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}
        >
          Browse recipes
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>

      {/* 2. METRICS CARDS GRID */}
      <div className="dashboard-grid">
        {/* Metric 1: Saved Recipes */}
        <div className="dash-card">
          <div className="dash-card-icon dash-icon-green">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
              <path d="M7 2v20"></path>
              <path d="M21 15V2v0a5 5 0 0 0-5 5v8c0 1.1.9 2 2 2h3Z"></path>
              <path d="M19 17v5"></path>
            </svg>
          </div>
          <div className="dash-card-value">{totalRecipes}</div>
          <div className="dash-card-label">Recipes saved</div>
        </div>

        {/* Metric 2: Meals Planned */}
        <div className="dash-card">
          <div className="dash-card-icon dash-icon-red">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div className="dash-card-value">{totalPlannedMeals}</div>
          <div className="dash-card-label">Meals planned</div>
        </div>

        {/* Metric 3: Items to Buy */}
        <div className="dash-card">
          <div className="dash-card-icon dash-icon-brown">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
          <div className="dash-card-value">{totalItemsToBuy}</div>
          <div className="dash-card-label">Items to buy</div>
        </div>
      </div>

      {/* 3. TODAY'S PLAN OVERVIEW */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2rem', marginBottom: '2rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>Today's plan</h3>
          <button 
            type="button" 
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer' }}
            onClick={() => setActiveNavigationTab('planner')}
          >
            Open planner
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          {todaysPlannedMeals.map(({ slot, recipe }) => (
            <div 
              key={slot} 
              style={{ 
                padding: '1.25rem', 
                borderRadius: 'var(--radius-lg)', 
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                boxShadow: 'var(--shadow-sm)',
                transition: 'var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                  {slot}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" strokeWidth="1">
                  <path d="M12 2l2.4 7.4L22 12l-7.6 2.6L12 22l-2.4-7.4L2 12l7.6-2.6z" />
                </svg>
              </div>

              {recipe ? (
                <>
                  <div style={{ height: '130px', width: '100%', overflow: 'hidden', borderRadius: 'var(--radius-md)', background: 'var(--primary-light)' }}>
                    {recipe.recipeImagePath ? (
                      <img 
                        src={recipe.recipeImagePath} 
                        alt={recipe.recipeTitle} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '800', color: 'var(--primary)', opacity: 0.2 }}>
                        {recipe.recipeTitle.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                      {recipe.recipeTitle}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {recipe.cookingDurationMinutes} min . Easy
                    </span>
                  </div>
                </>
              ) : (
                <button 
                  type="button"
                  onClick={() => setActiveNavigationTab('planner')}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    border: '2px dashed var(--border-color)', 
                    borderRadius: 'var(--radius-md)', 
                    background: 'transparent',
                    cursor: 'pointer',
                    minHeight: '130px',
                    width: '100%',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    color: 'var(--text-secondary)'
                  }}
                >
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
