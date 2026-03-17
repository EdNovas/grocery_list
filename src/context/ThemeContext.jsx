import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

// Resolve actual theme from preference
function resolveTheme(preference) {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return preference;
}

export function ThemeProvider({ children }) {
  // 'system' | 'light' | 'dark'
  const [preference, setPreference] = useState(() => {
    return localStorage.getItem('grocery-theme') || 'system';
  });

  const theme = resolveTheme(preference);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('grocery-theme', preference);
  }, [theme, preference]);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (preference !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => setPreference(p => p); // force re-render
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [preference]);

  const setThemePreference = (pref) => {
    setPreference(pref);
  };

  const toggleTheme = () => {
    // Cycle: system → light → dark → system
    setPreference(prev => {
      if (prev === 'system') return 'light';
      if (prev === 'light') return 'dark';
      return 'system';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference: setThemePreference, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
