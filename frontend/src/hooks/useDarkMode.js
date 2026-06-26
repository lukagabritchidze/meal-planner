import { useEffect, useState } from 'react';

const STORAGE_KEY = 'theme';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  const storedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Manages a binary light/dark theme preference, persists it to localStorage,
 * and applies the resolved theme to the document root.
 */
export function useDarkMode() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

  return { theme, isDark: theme === 'dark', setTheme, toggleTheme };
}
