import { useState } from 'react';
import styles from './RecipePickerModal.module.css';

/**
 * Reusable recipe selection modal with a search box and a responsive recipe grid.
 * Optionally renders a servings input (used by the Holiday planner) so a recipe
 * can be assigned to a slot with an explicit serving count.
 */
export const RecipePickerModal = ({
  isOpen,
  title,
  subtitle,
  recipes,
  searchTerm,
  onSearchTermChange,
  onSelectRecipe,
  onClose,
  showServings = false,
  emptyCatalogMessage = 'No recipes available. Go create some recipes in the Recipe Manager tab first!',
}) => {
  const [servings, setServings] = useState(4);

  if (!isOpen) return null;

  const handleSelect = (recipe) => {
    onSelectRecipe(recipe, showServings ? Math.max(1, parseInt(servings, 10) || 1) : undefined);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${styles.modalContent}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {title}
            {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
          </h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close recipe picker">×</button>
        </div>

        <div className={styles.searchWrap}>
          <input
            type="text"
            className={`form-input ${styles.searchInput}`}
            placeholder="Search recipe catalog..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
          />
        </div>

        {showServings && (
          <div className={styles.servingsWrap}>
            <label htmlFor="picker-servings">Servings</label>
            <input
              id="picker-servings"
              type="number"
              min="1"
              className={`form-input ${styles.servingsInput}`}
              value={servings}
              onChange={(e) => setServings(e.target.value)}
            />
          </div>
        )}

        <div className={`modal-body ${styles.body}`}>
          {recipes.length === 0 ? (
            <div className={styles.emptyMessage}>
              <p>{emptyCatalogMessage}</p>
            </div>
          ) : (
            <div className="picker-grid">
              {recipes.map((recipe) => (
                <div
                  key={recipe.recipeId}
                  className="picker-card"
                  onClick={() => handleSelect(recipe)}
                >
                  {recipe.recipeImagePath ? (
                    <img className="picker-thumb" src={recipe.recipeImagePath} alt={recipe.recipeTitle} />
                  ) : (
                    <div className={`picker-thumb ${styles.thumbFallback}`}>
                      {recipe.recipeTitle.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="picker-title">{recipe.recipeTitle}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
