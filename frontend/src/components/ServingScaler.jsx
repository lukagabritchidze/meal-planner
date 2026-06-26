import { useEffect, useRef, useState } from 'react';
import { recipeManagementApiService } from '../services/recipeManagementApiService';

/**
 * Backend-powered recipe serving scaler. It fetches converted metric ingredient
 * amounts whenever the user changes the serving count.
 */
export const ServingScaler = ({
  recipeId,
  initialServings = 4,
  onScaledRecipeChange,
  onLoadingChange,
  onError,
}) => {
  const [servings, setServings] = useState(Math.max(1, initialServings || 4));
  const latestRequestId = useRef(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setServings(Math.max(1, initialServings || 4));
  }, [recipeId, initialServings]);

  useEffect(() => {
    if (!recipeId) return;

    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;
    onLoadingChange?.(true);
    onError?.('');

    recipeManagementApiService.fetchScaledRecipeDetailsById(recipeId, servings)
      .then((scaledRecipe) => {
        if (latestRequestId.current === requestId) {
          onScaledRecipeChange?.(scaledRecipe);
        }
      })
      .catch((error) => {
        console.error('Failed to scale recipe:', error);
        if (latestRequestId.current === requestId) {
          onError?.('Unable to update servings right now. Showing the last loaded ingredient amounts.');
        }
      })
      .finally(() => {
        if (latestRequestId.current === requestId) {
          onLoadingChange?.(false);
        }
      });
  }, [recipeId, servings, onScaledRecipeChange, onLoadingChange, onError]);

  const decreaseServings = () => setServings((value) => Math.max(1, value - 1));
  const increaseServings = () => setServings((value) => value + 1);

  return (
    <div className="serving-scaler" aria-label="Serving scaler">
      <label className="scaler-label">Servings:</label>
      <div className="scaler-controls">
        <button
          type="button"
          className="scaler-btn"
          onClick={decreaseServings}
          disabled={servings === 1}
          aria-label="Decrease servings"
        >
          −
        </button>
        <span className="scaler-value" aria-live="polite">{servings}</span>
        <button
          type="button"
          className="scaler-btn"
          onClick={increaseServings}
          aria-label="Increase servings"
        >
          +
        </button>
      </div>
    </div>
  );
};
