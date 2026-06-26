import { useDarkMode } from '../hooks/useDarkMode';

/**
 * Sliding switch that flips between light and dark mode.
 */
export const ThemeToggle = ({ className = '' }) => {
  const { isDark, toggleTheme } = useDarkMode();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      className={`theme-switch ${className}`}
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle dark mode"
    >
      <span className="theme-switch-label">{isDark ? 'Dark mode' : 'Light mode'}</span>
      <span className="theme-switch-track" aria-hidden="true">
        <span className="theme-switch-icon sun">☀</span>
        <span className="theme-switch-icon moon">☾</span>
        <span className="theme-switch-thumb" />
      </span>
    </button>
  );
};
