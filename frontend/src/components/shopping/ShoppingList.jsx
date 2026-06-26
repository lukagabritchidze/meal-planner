import { useCallback, useEffect, useMemo, useState } from 'react';
import { recipeManagementApiService } from '../../services/recipeManagementApiService';
import { formatMeasurement } from '../../utils/measurementConverter';
import { ShoppingGroup } from './ShoppingGroup';

const DEPARTMENT_ORDER = ['Produce', 'Dairy', 'Meat', 'Pantry', 'Other'];

/**
 * Page-level shopping list view for the selected week.
 */
export const ShoppingList = ({
  mealPlansRevision,
  setCurrentWeekOffset,
  weekDates,
  formatDateString,
  onGoToPlanner,
}) => {
  const [groupedItems, setGroupedItems] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copyConfirmation, setCopyConfirmation] = useState('');

  const startDate = formatDateString(weekDates[0]);
  const endDate = formatDateString(weekDates[6]);

  const orderedGroups = useMemo(() => (
    DEPARTMENT_ORDER
      .map((department) => ({ department, items: groupedItems[department] || [] }))
      .filter((group) => group.items.length > 0)
  ), [groupedItems]);

  const itemCount = orderedGroups.reduce((sum, group) => sum + group.items.length, 0);

  const formatDateRange = () => {
    const firstDate = weekDates[0];
    const lastDate = weekDates[6];
    const firstMonth = firstDate.toLocaleDateString('en-US', { month: 'short' });
    const lastMonth = lastDate.toLocaleDateString('en-US', { month: 'short' });
    const firstDay = firstDate.getDate();
    const lastDay = lastDate.getDate();
    return firstMonth === lastMonth
      ? `${firstMonth} ${firstDay} – ${lastDay}`
      : `${firstMonth} ${firstDay} – ${lastMonth} ${lastDay}`;
  };

  const loadShoppingList = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const shoppingListData = await recipeManagementApiService.fetchShoppingList(startDate, endDate);
      setGroupedItems(shoppingListData || {});
    } catch (error) {
      console.error('Error loading shopping list:', error);
      setErrorMessage('Unable to load your shopping list. Please check the backend connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, mealPlansRevision]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadShoppingList();
  }, [loadShoppingList]);

  const updateItemCheckedState = (department, ingredientId, checked) => {
    setGroupedItems((previous) => ({
      ...previous,
      [department]: (previous[department] || []).map((item) => (
        item.ingredientId === ingredientId ? { ...item, checked } : item
      )),
    }));
  };

  const handleToggleItem = async (department, item) => {
    const nextChecked = !item.checked;
    updateItemCheckedState(department, item.ingredientId, nextChecked);

    try {
      await recipeManagementApiService.toggleShoppingListItem(item.ingredientId, startDate);
    } catch (error) {
      console.error('Error toggling shopping list item:', error);
      updateItemCheckedState(department, item.ingredientId, item.checked);
      setErrorMessage('Unable to update that item. Your change was rolled back.');
    }
  };

  const buildPlainTextList = () => {
    const lines = [`Shopping List — ${formatDateRange()}`, ''];
    orderedGroups.forEach((group) => {
      lines.push(`${group.department.toUpperCase()}`);
      group.items.forEach((item) => {
        const amount = formatMeasurement(item.amount, item.unit);
        lines.push(`  [ ] ${item.name}${amount ? ` — ${amount}` : ''}`);
      });
      lines.push('');
    });
    return lines.join('\n').trim();
  };

  const handleCopyAsText = async () => {
    const text = buildPlainTextList();
    try {
      await navigator.clipboard.writeText(text);
      setCopyConfirmation('Copied to clipboard');
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      setCopyConfirmation('Copy failed — select and copy manually');
    }
    setTimeout(() => setCopyConfirmation(''), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResetList = async () => {
    setErrorMessage('');
    try {
      await recipeManagementApiService.clearCheckedShoppingListItems(startDate, endDate);
      await loadShoppingList();
    } catch (error) {
      console.error('Error resetting shopping list:', error);
      setErrorMessage('Unable to reset the shopping list right now. Please try again.');
    }
  };

  return (
    <section className="shopping-list-page">
      <div className="print-receipt-header">
        <h1>Shopping List</h1>
        <p>{formatDateRange()} · {itemCount} items</p>
      </div>

      <div className="page-header shopping-list-header">
        <div className="header-title-block">
          <h1>Shopping List</h1>
          <p>Generated from planned meals for {formatDateRange()} · {itemCount} items</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={handleResetList} disabled={isLoading || itemCount === 0}>
          Reset List
        </button>
      </div>

      {itemCount > 0 && (
        <div className="shopping-export-bar">
          <button type="button" className="export-btn" onClick={handleCopyAsText}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            Copy as text
          </button>
          <button type="button" className="export-btn" onClick={handlePrint}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Print
          </button>
          {copyConfirmation && <span className="shopping-copy-toast" role="status">{copyConfirmation}</span>}
        </div>
      )}

      <div className="planner-nav shopping-week-nav">
        <button className="planner-nav-btn" onClick={() => setCurrentWeekOffset((prev) => prev - 1)} aria-label="Previous week">
          ←
        </button>
        <span className="planner-date-range">{formatDateRange()}</span>
        <button className="planner-nav-btn" onClick={() => setCurrentWeekOffset((prev) => prev + 1)} aria-label="Next week">
          →
        </button>
      </div>

      {errorMessage && <div className="inline-error-message" role="alert">{errorMessage}</div>}

      {isLoading ? (
        <div className="shopping-loading-card">
          <span className="skeleton-line title" />
          <span className="skeleton-line subtitle" />
          <span className="skeleton-line" />
        </div>
      ) : itemCount === 0 ? (
        <div className="empty-state shopping-empty-state">
          <div className="empty-state-icon" aria-hidden="true">🛒</div>
          <h3>No meals planned yet</h3>
          <p>No meals planned yet — head to the Planner to get started.</p>
          <button type="button" className="btn btn-primary" onClick={onGoToPlanner}>
            Go to Planner
          </button>
        </div>
      ) : (
        <div className="shopping-groups-stack">
          {orderedGroups.map((group) => (
            <ShoppingGroup
              key={group.department}
              department={group.department}
              items={group.items}
              onToggleItem={handleToggleItem}
            />
          ))}
        </div>
      )}
    </section>
  );
};
