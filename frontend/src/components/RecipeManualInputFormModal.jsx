import { useState } from 'react';

/**
 * Mobile-first ergonomic input modal for entering gourmet recipes manually.
 * Supports dynamic row additions/deletions for both ingredients list and instruction steps.
 */
export const RecipeManualInputFormModal = ({ isOpen, onClose, onSave }) => {
  // Master form inputs
  const [recipeTitle, setRecipeTitle] = useState('');
  const [recipeCategory, setRecipeCategory] = useState('Poultry');
  const [cookingDurationMinutes, setCookingDurationMinutes] = useState(20);
  
  // Dynamic ingredients state (starts with 1 blank row)
  const [ingredients, setIngredients] = useState([
    { ingredientName: '', ingredientQuantityValue: '', ingredientQuantityUnit: 'pcs' }
  ]);

  // Dynamic steps state (starts with 1 blank row)
  const [steps, setSteps] = useState([
    { instructionStepDescription: '' }
  ]);

  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  // Suffix selection configurations
  const unitOptions = ['pcs', 'grams', 'ml', 'cloves', 'tbsp', 'tsp', 'cups', 'ounces', 'packet', 'to taste'];
  const categoryOptions = ['Poultry', 'Vegetarian', 'Beef', 'Seafood', 'Pantry', 'Dessert', 'Breakfast', 'Snack'];

  // Handle dynamic additions
  const handleAddIngredientRow = () => {
    setIngredients([...ingredients, { ingredientName: '', ingredientQuantityValue: '', ingredientQuantityUnit: 'pcs' }]);
  };

  const handleRemoveIngredientRow = (index) => {
    if (ingredients.length === 1) return; // Keep at least one row
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index, field, value) => {
    const updatedIngredients = ingredients.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setIngredients(updatedIngredients);
  };

  const handleAddStepRow = () => {
    setSteps([...steps, { instructionStepDescription: '' }]);
  };

  const handleRemoveStepRow = (index) => {
    if (steps.length === 1) return; // Keep at least one row
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleStepChange = (index, value) => {
    const updatedSteps = steps.map((item, i) => {
      if (i === index) {
        return { ...item, instructionStepDescription: value };
      }
      return item;
    });
    setSteps(updatedSteps);
  };

  // Form submission mapping
  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    // Field validations
    if (!recipeTitle.trim()) {
      setFormError('Please enter a recipe title.');
      return;
    }

    if (cookingDurationMinutes <= 0) {
      setFormError('Cooking duration must be greater than zero.');
      return;
    }

    // Filter out blank inputs and format payload mapping
    const validIngredients = ingredients
      .filter(ing => ing.ingredientName.trim() !== '')
      .map(ing => ({
        ingredientName: ing.ingredientName.trim(),
        ingredientQuantityValue: parseFloat(ing.ingredientQuantityValue) || 1.0,
        ingredientQuantityUnit: ing.ingredientQuantityUnit
      }));

    const validSteps = steps
      .filter(st => st.instructionStepDescription.trim() !== '')
      .map((st, idx) => ({
        instructionStepOrder: idx + 1, // Set auto ordering indexes
        instructionStepDescription: st.instructionStepDescription.trim()
      }));

    if (validIngredients.length === 0) {
      setFormError('Please enter at least one valid ingredient.');
      return;
    }

    if (validSteps.length === 0) {
      setFormError('Please enter at least one instruction step.');
      return;
    }

    // Construct Spring Boot REST JSON contract payload
    const recipePayload = {
      recipeTitle: recipeTitle.trim(),
      recipeCategory,
      cookingDurationMinutes: parseInt(cookingDurationMinutes),
      recipeIngredients: validIngredients,
      recipeInstructionSteps: validSteps
    };

    onSave(recipePayload);
    
    // Clear form state upon save success
    setRecipeTitle('');
    setRecipeCategory('Poultry');
    setCookingDurationMinutes(20);
    setIngredients([{ ingredientName: '', ingredientQuantityValue: '', ingredientQuantityUnit: 'pcs' }]);
    setSteps([{ instructionStepDescription: '' }]);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Sticky Header */}
        <div className="modal-header">
          <h2 className="modal-title">Create Manual Recipe</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">×</button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {formError && (
              <div style={{ backgroundColor: 'var(--color-danger-light)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                {formError}
              </div>
            )}

            {/* Title & Category Info Row */}
            <div className="form-group">
              <label className="form-label" htmlFor="input-recipe-title">Recipe Title</label>
              <input
                id="input-recipe-title"
                type="text"
                className="form-input"
                placeholder="e.g. Grandma's Chocolate Chip Cookies"
                value={recipeTitle}
                onChange={(e) => setRecipeTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="input-recipe-category">Category</label>
                <select
                  id="input-recipe-category"
                  className="form-select"
                  value={recipeCategory}
                  onChange={(e) => setRecipeCategory(e.target.value)}
                >
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-cooking-duration">Cook Time (Minutes)</label>
                <input
                  id="input-cooking-duration"
                  type="number"
                  className="form-input"
                  min="1"
                  value={cookingDurationMinutes}
                  onChange={(e) => setCookingDurationMinutes(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Dynamic Ingredient Rows Block */}
            <div className="dynamic-form-section">
              <div className="dynamic-form-header">
                <h3 className="form-label" style={{ margin: 0 }}>Ingredients List</h3>
                <button type="button" className="btn-add-dynamic" onClick={handleAddIngredientRow}>
                  + Add Ingredient
                </button>
              </div>

              {ingredients.map((ing, idx) => (
                <div key={idx} className="dynamic-row">
                  <div className="dynamic-row-input-group">
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '0.5rem 0.75rem' }}
                      placeholder="Ingredient name (e.g. Milk)"
                      value={ing.ingredientName}
                      onChange={(e) => handleIngredientChange(idx, 'ingredientName', e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      style={{ padding: '0.5rem 0.75rem' }}
                      placeholder="Qty (e.g. 2)"
                      value={ing.ingredientQuantityValue}
                      onChange={(e) => handleIngredientChange(idx, 'ingredientQuantityValue', e.target.value)}
                      required
                    />
                    <select
                      className="form-select"
                      style={{ padding: '0.5rem 0.75rem' }}
                      value={ing.ingredientQuantityUnit}
                      onChange={(e) => handleIngredientChange(idx, 'ingredientQuantityUnit', e.target.value)}
                    >
                      {unitOptions.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    type="button"
                    className="btn-delete-icon"
                    disabled={ingredients.length === 1}
                    style={{ opacity: ingredients.length === 1 ? 0.3 : 1, cursor: ingredients.length === 1 ? 'not-allowed' : 'pointer' }}
                    onClick={() => handleRemoveIngredientRow(idx)}
                    aria-label="Remove ingredient"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Dynamic Step Rows Block */}
            <div className="dynamic-form-section" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
              <div className="dynamic-form-header">
                <h3 className="form-label" style={{ margin: 0 }}>Preparation Steps</h3>
                <button type="button" className="btn-add-dynamic" onClick={handleAddStepRow}>
                  + Add Step
                </button>
              </div>

              {steps.map((st, idx) => (
                <div key={idx} className="dynamic-row" style={{ alignItems: 'flex-start' }}>
                  <span className="step-number-bubble" style={{ marginTop: '6px' }}>{idx + 1}</span>
                  
                  <textarea
                    className="form-textarea"
                    rows="2"
                    style={{ padding: '0.5rem 0.75rem', flex: 1, resize: 'none' }}
                    placeholder="Describe this preparation step..."
                    value={st.instructionStepDescription}
                    onChange={(e) => handleStepChange(idx, e.target.value)}
                    required
                  />

                  <button
                    type="button"
                    className="btn-delete-icon"
                    disabled={steps.length === 1}
                    style={{ opacity: steps.length === 1 ? 0.3 : 1, cursor: steps.length === 1 ? 'not-allowed' : 'pointer', marginTop: '6px' }}
                    onClick={() => handleRemoveStepRow(idx)}
                    aria-label="Remove step"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Recipe
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
