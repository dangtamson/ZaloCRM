import { useEffect, useState } from 'react';

export type ThemeName = 'smax-light' | 'legacy-dark';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeName>(() => {
    if (typeof window === 'undefined') return 'smax-light';
    return (window.localStorage.getItem('theme') as ThemeName | null) ?? 'smax-light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  return {
    theme,
    isDark: theme === 'legacy-dark',
    toggleTheme: () => setTheme((current) => (current === 'legacy-dark' ? 'smax-light' : 'legacy-dark')),
    setTheme,
  };
}
