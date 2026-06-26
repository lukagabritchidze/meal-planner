import { useState } from 'react';
import { RecipeCard } from './RecipeCard';

/**
 * Interactive search, filter, and responsive grid layout for displaying recipes.
 * Styled to match Screenshot 2.
 */
export const RecipeGrid = ({ 
  recipeListPayload, 
  isLoading, 
  onViewDetails, 
  onToggleFavorite, 
  onAddNewRecipeTrigger,
  onSearch,
  onSearchIngredients,
  activeHoliday,
  onSelectHoliday
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Multi-select Fridge Ingredients tag state
  const [ingredientInput, setIngredientInput] = useState('');
  const [fridgeIngredients, setFridgeIngredients] = useState([]);

  // Category filters exactly matching Screenshot 2
  const categoryFilters = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Vegetarian'];

  const holidays = [
    { id: 'Christmas', label: '🎄 Christmas' },
    { id: 'Easter', label: '🐣 Easter' },
    { id: 'Thanksgiving', label: '🦃 Thanksgiving' },
    { id: 'Halloween', label: '🎃 Halloween' },
  ];

  const handleKeywordSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      setFridgeIngredients([]);
      onSearch(searchTerm, selectedCategory);
    }
  };

  const handleKeywordSearchClick = () => {
    setFridgeIngredients([]);
    onSearch(searchTerm, selectedCategory);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setFridgeIngredients([]);
    onSearch(searchTerm, category);
  };

  const handleAddIngredient = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && ingredientInput.trim() !== '') {
      e.preventDefault();
      const cleaned = ingredientInput.trim().replace(/,/g, '').toLowerCase();
      if (cleaned && !fridgeIngredients.includes(cleaned)) {
        const nextIngredients = [...fridgeIngredients, cleaned];
        setFridgeIngredients(nextIngredients);
        setSearchTerm('');
        onSelectHoliday('None');
        onSearchIngredients(nextIngredients);
      }
      setIngredientInput('');
    }
  };

  const handleRemoveIngredient = (indexToRemove) => {
    const nextIngredients = fridgeIngredients.filter((_, index) => index !== indexToRemove);
    setFridgeIngredients(nextIngredients);
    if (nextIngredients.length > 0) {
      onSearchIngredients(nextIngredients);
    } else {
      onSelectHoliday('None');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setFridgeIngredients([]);
    onSelectHoliday('None');
  };

  return (
    <section style={{ maxWidth: '950px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: '0.2rem' }}>Recipes</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>A warm little library of weekday favorites.</p>
        </div>
        <button className="btn btn-primary" onClick={onAddNewRecipeTrigger} style={{ borderRadius: '9999px', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
          + Add manual recipe
        </button>
      </div>

      {/* Search Input (Full Width, Rounded, Larger) */}
      <div className="search-wrapper" style={{ marginBottom: '1.5rem', position: 'relative' }}>
        <span 
          className="search-icon" 
          onClick={handleKeywordSearchClick} 
          style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </span>
        <input
          type="text"
          className="search-input"
          placeholder="Search thousands of recipes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeywordSearchKeyDown}
          style={{
            width: '100%',
            padding: '0.95rem 1rem 0.95rem 3.25rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '9999px',
            outline: 'none',
            fontSize: '1rem',
            transition: 'var(--transition-fast)',
            boxShadow: 'var(--shadow-sm)'
          }}
        />
      </div>

      {/* Category Filter Pills (Larger) */}
      <div className="filter-group" style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
        {categoryFilters.map((category) => {
          const isActive = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => handleCategorySelect(category)}
              style={{
                padding: '0.6rem 1.35rem',
                borderRadius: '9999px',
                border: '1px solid var(--border-color)',
                background: isActive ? 'var(--primary)' : 'var(--bg-card)',
                color: isActive ? '#fff' : 'var(--text-primary)',
                fontSize: '0.92rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Fridge Ingredient Tags (Optional/Stage 2 requirement, styled subtly) */}
      <div className="fridge-ingredient-filter" style={{ marginBottom: '1.5rem', background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Fridge Ingredients Search:</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center', marginTop: '0.4rem' }}>
          {fridgeIngredients.map((ingredient, index) => (
            <span 
              key={index} 
              className="card-tag tag-category"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)' }}
            >
              {ingredient}
              <button 
                type="button" 
                onClick={() => handleRemoveIngredient(index)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', color: 'inherit' }}
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={ingredientInput}
            onChange={(e) => setIngredientInput(e.target.value)}
            onKeyDown={handleAddIngredient}
            placeholder={fridgeIngredients.length === 0 ? "Type ingredient and press Enter..." : "+ Add..."}
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.82rem', flex: 1, minWidth: '130px' }}
          />
        </div>
      </div>

      {/* Holiday Menus Card Box */}
      <div 
        className="holiday-menus-card"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
          HOLIDAY MENUS
        </span>
        <span style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', marginTop: '0.1rem' }}>
          Curated festive dishes for special occasions.
        </span>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginTop: '0.6rem' }}>
          {holidays.map((h) => {
            const isActive = activeHoliday === h.id;
            return (
              <button
                key={h.id}
                type="button"
                className={`holiday-filter-btn ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setFridgeIngredients([]);
                  setSearchTerm('');
                  onSelectHoliday(isActive ? 'None' : h.id);
                }}
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: isActive ? 'var(--accent)' : 'var(--bg-app)',
                  color: isActive ? '#fff' : 'var(--text-primary)',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'var(--transition-fast)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {h.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Subtitle Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>

        </span>
        <span style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
          Search above or pick a category to discover more recipes.
        </span>
      </div>

      {/* Recipes Cards Grid */}
      {isLoading ? (
        <div className="recipe-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-banner"></div>
              <div className="skeleton-body">
                <div className="skeleton-line title"></div>
                <div className="skeleton-line subtitle"></div>
                <div className="skeleton-line button"></div>
              </div>
            </div>
          ))}
        </div>
      ) : recipeListPayload.length > 0 ? (
        <div className="recipe-grid">
          {recipeListPayload.map((recipe) => (
            <RecipeCard
              key={recipe.recipeId}
              recipe={recipe}
              onViewDetails={() => onViewDetails(recipe.recipeId)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <h3>No Recipes Found</h3>
          <p>
            {searchTerm || selectedCategory !== 'All' || fridgeIngredients.length > 0 || activeHoliday !== 'None'
              ? "We couldn't find any matches. Try resetting your search query and filters." 
              : "Your cookbook is empty. Start by creating a delicious new recipe manual!"}
          </p>
          <button 
            type="button"
            className="btn btn-secondary"
            onClick={handleResetFilters}
          >
            Reset All Filters
          </button>
        </div>
      )}
    </section>
  );
};
