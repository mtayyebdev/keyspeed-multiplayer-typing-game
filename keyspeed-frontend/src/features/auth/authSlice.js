import { createSlice } from '@reduxjs/toolkit';

const savedToken = typeof window !== 'undefined' ? localStorage.getItem('keyspeed_token') : null;

const initialState = {
  token: savedToken || null,
  keyspeed_token: savedToken || null,
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
      const { user, keyspeed_token, token } = action.payload || {};
      const activeToken = keyspeed_token || token || null;
      state.token = activeToken;
      state.keyspeed_token = activeToken;
      state.user = user || null;
      state.isAuthenticated = true;
      state.isInitialized = true;
      state.isLoading = false;
      if (activeToken) {
        localStorage.setItem('keyspeed_token', activeToken);
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
      state.keyspeed_token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      state.isLoading = false;
      localStorage.removeItem('keyspeed_token');
    },
    logout: (state) => {
      state.token = null;
      state.keyspeed_token = null;
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

