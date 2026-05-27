import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── PALETAS DE COLORES ───
export const Colors = {
  light: {
    background: '#FFFFFF',
    surface: '#F8F9FB',
    card: '#FFFFFF',
    text: '#1C1C1E',
    textSecondary: '#8E8E93',
    primary: '#007AFF',
    border: '#F2F2F7',
    separator: '#F2F2F7',
    error: '#FF3B30',
    success: '#34C759',
    info: '#007AFF',
    warning: '#FF9500',
    tabBar: '#FFFFFF',
    modalOverlay: 'rgba(0,0,0,0.4)',
  },
  dark: {
    background: '#000000',
    surface: '#121212',
    card: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    primary: '#0A84FF',
    border: '#38383A',
    separator: '#2C2C2E',
    error: '#FF453A',
    success: '#32D74B',
    info: '#0A84FF',
    warning: '#FF9F0A',
    tabBar: '#121212',
    modalOverlay: 'rgba(0,0,0,0.7)',
  }
};

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  colors: typeof Colors.light;
  isDark: boolean;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('system');
  const [isThemeReady, setIsThemeReady] = useState(false);

  // Cargar tema guardado al iniciar
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('user-theme');
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
        setThemeState(savedTheme as ThemeType);
      }
    } catch (e) {
      console.log('Error loading theme', e);
    } finally {
      setIsThemeReady(true);
    }
  };

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem('user-theme', newTheme);
    } catch (e) {
      console.log('Error saving theme', e);
    }
  };

  // Determinar si el modo actual es oscuro
  const isDark = theme === 'system' 
    ? systemColorScheme === 'dark' 
    : theme === 'dark';

  const colors = isDark ? Colors.dark : Colors.light;

  if (!isThemeReady) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, colors, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
