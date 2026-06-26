import { useState } from 'react';
import { formatMeasurement } from '../../utils/measurementConverter';

/**
 * Collapsible department section for a shopping list.
 */
export const ShoppingGroup = ({ department, items, onToggleItem }) => {
  const [isOpen, setIsOpen] = useState(true);
  const checkedCount = items.filter((item) => item.checked).length;
  const totalCount = items.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((checkedCount / totalCount) * 100);

  return (
    <section className="shopping-group-card">
      <button
        type="button"
        className="shopping-group-header"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
      >
        <div>
          <span className="shopping-group-title">{department} ({totalCount})</span>
          <span className="shopping-group-progress-label">{checkedCount} / {totalCount} checked</span>
        </div>
        <div className="shopping-group-header-right">
          <div className="shopping-progress-track" aria-hidden="true">
            <span className="shopping-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className={`shopping-collapse-icon ${isOpen ? 'open' : ''}`}>⌄</span>
        </div>
      </button>

      <div className={`shopping-group-items ${isOpen ? 'open' : ''}`}>
        {items.map((item) => (
          <label key={item.ingredientId || `${department}-${item.name}-${item.unit}`} className={`shopping-row ${item.checked ? 'checked' : ''}`}>
            <span className="shopping-checkbox-wrap">
              <input
                type="checkbox"
                className="shopping-checkbox-large"
                checked={item.checked}
                onChange={() => onToggleItem(department, item)}
              />
            </span>
            <span className="shopping-row-name">{item.name}</span>
            <span className="shopping-row-amount">
              {formatMeasurement(item.amount, item.unit)}
            </span>
          </label>
        ))}
      </div>
    </section>
  );
};
