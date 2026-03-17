import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

// Light/dark mode
function resolveTheme(preference) {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return preference;
}

// Style themes: default | warm | colorful | minimal
const STYLE_THEMES = [
  { id: 'default', name: '🌙 经典深色', desc: '默认科技风' },
  { id: 'warm', name: '🍃 温暖自然', desc: '暖色渐变，食物质感' },
  { id: 'colorful', name: '🌈 彩色活泼', desc: '多彩分类，活力四射' },
  { id: 'minimal', name: '⚡ 极简高级', desc: '极简克制，高级感' },
];

export { STYLE_THEMES };

export function ThemeProvider({ children }) {
  // Light/dark: 'system' | 'light' | 'dark'
  const [preference, setPreference] = useState(() => {
    return localStorage.getItem('grocery-theme') || 'system';
  });

  // Style theme: 'default' | 'warm' | 'colorful' | 'minimal'
  const [styleTheme, setStyleTheme] = useState(() => {
    return localStorage.getItem('grocery-style-theme') || 'default';
  });

  const theme = resolveTheme(preference);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('grocery-theme', preference);
  }, [theme, preference]);

  useEffect(() => {
    document.documentElement.setAttribute('data-style', styleTheme);
    localStorage.setItem('grocery-style-theme', styleTheme);
  }, [styleTheme]);

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
    setPreference(prev => {
      if (prev === 'system') return 'light';
      if (prev === 'light') return 'dark';
      return 'system';
    });
  };

  return (
    <ThemeContext.Provider value={{
      theme, preference, setPreference: setThemePreference, toggleTheme,
      styleTheme, setStyleTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
