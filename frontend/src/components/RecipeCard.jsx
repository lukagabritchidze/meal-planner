
export const RecipeCard = ({ recipe, onViewDetails, onToggleFavorite }) => {
  const { 
    recipeId, 
    recipeTitle, 
    cookingDurationMinutes, 
    recipeImagePath, 
    isFavorited
  } = recipe;

  return (
    <article className="recipe-card" onClick={() => onViewDetails(recipeId)}>
      <div className="card-image-wrapper">
        {recipeImagePath ? (
          <img src={recipeImagePath} alt={recipeTitle} loading="lazy" />
        ) : (
          <div className="card-image-fallback">{recipeTitle ? recipeTitle.charAt(0) : '?'}</div>
        )}
        <button
          className={`heart-btn ${isFavorited ? 'favorited' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(recipeId); }}
          aria-label={isFavorited ? 'Unfavorite' : 'Favorite'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
      <div className="card-body">
        <h3 className="card-title">{recipeTitle}</h3>
        <p className="card-description" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>
          {cookingDurationMinutes} min &middot; Easy
        </p>
      </div>
    </article>
  );
};
