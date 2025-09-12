import { useState, useEffect } from 'react';
import { Theme } from '@/types';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Load theme from storage
    chrome.storage.sync.get(['theme'], (result) => {
      if (result.theme) {
        setTheme(result.theme);
        document.documentElement.classList.toggle('dark', result.theme === 'dark');
      }
    });
  }, []);

  const toggleTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    
    // Save to storage
    chrome.storage.sync.set({ theme: newTheme });
  };

  return { theme, toggleTheme };
};
