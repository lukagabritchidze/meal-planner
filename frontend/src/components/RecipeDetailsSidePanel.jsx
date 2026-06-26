import { useCallback, useState } from 'react';
import { ServingScaler } from './ServingScaler';
import { CalendarDatePicker } from './common/CalendarDatePicker';
import { formatMeasurement } from '../utils/measurementConverter';

/**
 * A sleek sliding side panel that emerges from the right side of the screen.
 * Displays detailed information about a selected recipe, portion scaling, allergen indicators,
 * and a quick planner scheduler.
 */
export const RecipeDetailsSidePanel = ({ isOpen, onClose, recipe, onDeleteRecipe, onPlanMeal }) => {
  const [isPlanning, setIsPlanning] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('Dinner');

  // Default the scheduler to today's date.
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const [scaledRecipe, setScaledRecipe] = useState(null);
  const [isScalingLoading, setIsScalingLoading] = useState(false);
  const [scalingError, setScalingError] = useState('');

  const handleScaledRecipeChange = useCallback((scaledRecipe) => {
    setScaledRecipe(scaledRecipe);
  }, []);

  const handleScalingLoadingChange = useCallback((loading) => {
    setIsScalingLoading(loading);
  }, []);

  const handleScalingError = useCallback((message) => {
    setScalingError(message);
  }, []);

  if (!isOpen || !recipe) return null;

  const {
    recipeId,
    recipeTitle,
    recipeCategory,
    cookingDurationMinutes,
    recipeImagePath,
    recipeInstructionSteps,
    isGlutenFree,
    isDairyFree,
    isNutFree
  } = recipe;

  const displayedRecipe = scaledRecipe?.recipeId === recipeId ? scaledRecipe : recipe;
  const displayedIngredients = displayedRecipe?.recipeIngredients || recipe.recipeIngredients || [];

  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSchedulerPlanSubmit = () => {
    if (onPlanMeal) {
      const dateStr = formatDateString(selectedDate);
      onPlanMeal(dateStr, selectedSlot, recipe);
      setIsPlanning(false);
      alert(`Scheduled "${recipeTitle}" for ${selectedSlot} on ${selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}!`);
    }
  };

  const renderCalendarPopover = () => {
    return (
      <div 
        className="calendar-popover"
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          zIndex: 999,
          width: '320px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)',
          padding: '1.25rem',
          marginTop: '0.5rem'
        }}
      >
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Meal type</label>
          <select 
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              outline: 'none',
              background: 'var(--bg-card)',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}
          >
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
          </select>
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Date</label>
          <CalendarDatePicker value={selectedDate} onChange={setSelectedDate} />
        </div>

        <button 
          type="button"
          className="btn"
          onClick={handleSchedulerPlanSubmit}
          style={{
            width: '100%',
            marginTop: '0.5rem',
            backgroundColor: 'var(--primary)',
            color: 'var(--color-text-inverse)',
            borderRadius: '9999px',
            padding: '0.5rem 1.25rem',
            fontSize: '0.88rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          ✓ Add to {selectedSlot}
        </button>
      </div>
    );
  };

  const hasAllergens = !isGlutenFree || !isDairyFree || !isNutFree;

  return (
    <div className="detail-panel-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(event) => event.stopPropagation()}>
        
        {/* Close (×) Button — Top-Right Corner over Image */}
        <button 
          className="detail-panel-close" 
          onClick={onClose} 
          aria-label="Close details panel"
        >
          ×
        </button>

        {/* Large Food Hero Photo Banner with Fade Gradient */}
        <div style={{ position: 'relative', width: '100%', height: '260px', overflow: 'hidden' }}>
          {recipeImagePath ? (
            <img 
              className="detail-panel-image" 
              src={recipeImagePath} 
              alt={recipeTitle} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)' }}
              loading="lazy" 
            />
          ) : (
            <div className="detail-panel-image-fallback" style={{ borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)' }}>
              {recipeTitle ? recipeTitle.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '80px',
            background: 'linear-gradient(to bottom, transparent, var(--bg-card))',
            pointerEvents: 'none'
          }}></div>
        </div>

        {/* Panel Header */}
        <div className="detail-panel-header">
          
          <h2 className="detail-panel-title">{recipeTitle}</h2>
          
          <div className="detail-panel-tags">
            <span className="card-tag tag-category">{recipeCategory || 'General'}</span>
            <span className="card-tag tag-duration">{cookingDurationMinutes} min</span>
            <span className="card-tag tag-easy">Easy</span>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="detail-panel-body" style={{ position: 'relative' }}>
          
          {/* Scheduling & Servings Controller Row */}
          <div className="detail-panel-actions-row">
            <div style={{ position: 'relative' }}>
              <button 
                type="button" 
                className="btn" 
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--color-text-inverse)',
                  borderRadius: '9999px',
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.88rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => setIsPlanning(!isPlanning)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Add to meal plan
              </button>
              {isPlanning && renderCalendarPopover()}
            </div>
            
            <ServingScaler
              recipeId={recipeId}
              initialServings={recipe.defaultServings || 4}
              onScaledRecipeChange={handleScaledRecipeChange}
              onLoadingChange={handleScalingLoadingChange}
              onError={handleScalingError}
            />
          </div>

          {scalingError && (
            <div className="inline-error-message" role="alert">
              {scalingError}
            </div>
          )}

          {/* Allergen Warning Card Box */}
          {hasAllergens && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              backgroundColor: 'var(--color-danger-light)',
              border: '1px solid var(--color-danger)',
              borderRadius: 'var(--radius)',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              color: 'var(--color-danger)'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Contains Allergen:</span>
                {!isGlutenFree && <span style={{ backgroundColor: 'var(--color-danger)', color: 'var(--color-text-inverse)', fontSize: '0.72rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '9999px', textTransform: 'uppercase' }}>Gluten</span>}
                {!isDairyFree && <span style={{ backgroundColor: 'var(--color-danger)', color: 'var(--color-text-inverse)', fontSize: '0.72rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '9999px', textTransform: 'uppercase' }}>Dairy</span>}
                {!isNutFree && <span style={{ backgroundColor: 'var(--color-danger)', color: 'var(--color-text-inverse)', fontSize: '0.72rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '9999px', textTransform: 'uppercase' }}>Nuts</span>}
              </div>
            </div>
          )}

          {/* Section: Ingredients */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 className="section-title">Ingredients</h3>
            <div className="ingredients-list">
              {displayedIngredients && displayedIngredients.length > 0 ? (
                displayedIngredients.map((ingredient) => (
                  <div key={ingredient.recipeIngredientId || ingredient.ingredientName} className="ingredient-item">
                    <span className="ingredient-name">{ingredient.ingredientName}</span>
                    {isScalingLoading ? (
                      <span className="ingredient-amount-skeleton" aria-label="Updating ingredient amount" />
                    ) : (
                      <span className="ingredient-amt">
                        {formatMeasurement(ingredient.ingredientQuantityValue, ingredient.ingredientQuantityUnit)}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No ingredients listed.</p>
              )}
            </div>
          </div>

          {/* Section: Preparation Steps */}
          <div>
            <h3 className="section-title" style={{ marginBottom: '0.75rem' }}>Steps</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recipeInstructionSteps && recipeInstructionSteps.length > 0 ? (
                recipeInstructionSteps
                  .sort((firstStep, secondStep) => firstStep.instructionStepOrder - secondStep.instructionStepOrder)
                  .map((step) => (
                    <div 
                      key={step.recipeInstructionStepId || step.instructionStepOrder} 
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        padding: '1rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius)',
                        backgroundColor: 'var(--bg-card)'
                      }}
                    >
                      <div style={{
                        backgroundColor: 'var(--primary)',
                        color: 'var(--color-text-inverse)',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        flexShrink: 0
                      }}>
                        {step.instructionStepOrder}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5, paddingTop: '2px' }}>
                        {step.instructionStepDescription}
                      </div>
                    </div>
                  ))
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No steps listed.</p>
              )}
            </div>
          </div>

        </div>

        {/* Panel Sticky Footer Action Buttons */}
        <div className="detail-panel-footer">
          <button 
            type="button"
            className="btn btn-danger"
            onClick={() => {
              if (window.confirm(`Are you absolutely sure you want to delete "${recipeTitle}" permanently?`)) {
                onDeleteRecipe(recipeId);
                onClose();
              }
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              style={{ marginRight: '6px' }}
            >
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Delete Recipe
          </button>
          

        </div>

      </div>
    </div>
  );
};
