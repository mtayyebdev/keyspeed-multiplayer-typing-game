import { createSlice } from '@reduxjs/toolkit';

export const THEMES = [
  {
    id: 'light',
    name: 'Light',
    bg: '#FFFFFF',
    text: '#0A0A0A',
    accent: '#2563EB',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    bg: '#0B0B0F',
    text: '#F4F4F5',
    accent: '#22D3EE',
  },
  {
    id: 'terminal',
    name: 'Terminal',
    bg: '#050805',
    text: '#A7F3D0',
    accent: '#22C55E',
  },
  {
    id: 'sand',
    name: 'Sand',
    bg: '#F5EFE6',
    text: '#2B2118',
    accent: '#C2410C',
  },
];

const getStoredTheme = () => {
  try {
    const saved = localStorage.getItem('keyspeed_theme') || localStorage.getItem('typearena_theme');
    if (THEMES.some((t) => t.id === saved)) {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'midnight';
};

const initialTheme = getStoredTheme();

const themeSlice = createSlice({
  name: 'theme',
  initialState: {
    current: initialTheme,
  },
  reducers: {
    setTheme: (state, action) => {
      const themeId = action.payload;
      if (THEMES.some((t) => t.id === themeId)) {
        state.current = themeId;
        try {
          localStorage.setItem('keyspeed_theme', themeId);
          document.documentElement.setAttribute('data-theme', themeId);
        } catch {
          // ignore
        }
      }
    },
  },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;

