import { createSlice } from '@reduxjs/toolkit';

const savedToken = typeof window !== 'undefined' ? localStorage.getItem('keyspeed_token') : null;

const initialState = {
  token: savedToken || null,
  user: null,
  isAuthenticated: Boolean(savedToken),
  isInitialized: false,
  isLoading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload || {};
      state.token = token || null;
      state.user = user || null;
      state.isAuthenticated = true;
      state.isInitialized = true;
      state.isLoading = false;
      if (token) {
        localStorage.setItem('keyspeed_token', token);
      }
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = Boolean(action.payload);
      state.isInitialized = true;
      state.isLoading = false;
    },
    setUnauthenticated: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      state.isLoading = false;
      localStorage.removeItem('keyspeed_token');
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      state.isLoading = false;
      localStorage.removeItem('keyspeed_token');
    },
    setAuthLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, setUser, setUnauthenticated, logout, setAuthLoading } = authSlice.actions;
export default authSlice.reducer;

